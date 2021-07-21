//jshint version:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to our new  To Do list"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

app.get('/', function(req, res) {
  Item.find({}, function(err, foundItems) {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err) {
        if(err){
          console.log("No se pudo insertar los elementos: " + err);
        } else {
          res.render('index', {listTitle: "today", newListItem: results});
        }
      });
      res.redirect("/");
    } else {
      res.render('index', {listTitle: "today", newListItem: foundItems});
    }
  });
});

app.post('/', function(req, res) {
  const itemName = req.body.newItem;
  const listName  = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    })
  }
});

app.post('/delete', function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "today"){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(err){
        console.log("no se pudo eliminar el item: " + err);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList) {
        if(!err){
          res.redirect("/" + listName);
        }
      });
  }
});

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(err){
      console.log("Error al verificar si existe la coleccion" + err);
    } else {
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
      } else {
        res.render('index', {listTitle: customListName, newListItem: foundList.items});
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has running successfully");
})
