const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dc28ptgvd", 
  api_key: "918742394361623", 
  api_secret: "-clurVTMtJLW_r8DY-8qagTytv8",
});

module.exports = cloudinary;
