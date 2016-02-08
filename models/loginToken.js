

module.exports = function(mongoose) {

  var schema = mongoose.Schema({
    email: String,
    series: String,
    token: String
  });

  schema.methods.randomToken = function () {
    return Math.round((new Date().valueOf()*Math.random())) + '';
  }

  schema.pre('save', function (next) {
      this.token = this.randomToken();
      this.series = this.randomToken();
      next(); 
  });

  var model = mongoose.model('LoginToken', schema);
  return model;
};