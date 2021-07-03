print("name,id,email");
db.User.find().forEach(function (user) {
  print(user.name + "," + user._id.valueOf() + "," + user.email);
});
