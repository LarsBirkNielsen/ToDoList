//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const app = express();
const _ = require('lodash');


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

//Setting up my models//
const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);


const listsSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listsSchema);
//--------------//

//Creating 3 Items//

const cola = new Item({
  name: "Coke"
});

const toiletpaper = new Item({
  name: "Toiletpaper"
});

const soap = new Item({
  name: "Soap"
});
//--------------//



app.get("/", function(req, res) {
  Item.find({},function(err,items){ //Looking for all items, if its empty ill use my 3 created items
    if(items.length == 0){
      Item.insertMany([cola, toiletpaper,soap], function(err){
      if(err){
        console.log(err)
      }else{
        console.log("Succesfully saved all the itmes")
      }
    });
     res.redirect("/");
   } else { // Ill read the items wether it was created abow or if items.length > 0
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });
});

//Custome Routing//

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName); //I catch the rout parameter in a const

  List.findOne({name: customListName},function(err,foundList){ // I check if the list already exists
    if(!err){
      if(!foundList){
        //If we dont find a list, we create a new list
        const list = new List({
          name: customListName,
          items: []
        });
        list.save();
        res.redirect("/" + customListName);
      }else{
        //If we did find a list, we show that exesting list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});
//--------------//



app.post("/", function(req, res){

  const itemName = req.body.newItem; //The newItem in req.body.newItem is the name of the input field where type in a to do item
  const listName = req.body.list; //The list in req.body.list is the name of the add button


//Creating a new item with the name typed in the inputfield
  const item = new Item({
    name: itemName
  });

  //Checking if we are on the default/start List
  if(listName === "Today"){
    item.save();
    res.redirect("/");
    //If we are on a custome List, we need to save on that specific list and redirect to it
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox; //The checkbox in req.body.checkbox is the name of checkbox, witch contains the value of the itemId
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("successfully deleted te checked item.");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
