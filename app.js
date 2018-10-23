const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// Mongo URI
const mongoURI = 'mongodb://lelanavilla:getmoney88@ds139243.mlab.com:39243/esko';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);
// let db = mongoose.connection;
// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET /
// @desc Loads form
app.get('/', (req, res) => {
 gfs.files.find().toArray((err, files)=>{
      if(!files || files.length === 0){
       res.render('index', {files:false});  
      } else{
        files.map(file =>{
         if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
            file.isImage = true;
          } else {
            file.isImage = false;
          }
        });
        res.render('index', {files: files});
      }
    })
  })
  
  //@route GET /files/:filename
  //desc display files in json
  app.get('/files/:filename', (req,res)=>{
    gfs.files.findOne({filename: req.params.filename}, (err, file)=>{
      if(!file || file.length === 0){
  return res.status(404).json({
    err: 'No file exists by that name'
  })
      }
      return res.json(file);
    })
  
  });
  
  

// @route POST /upload
// @desc  Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file });
  res.redirect('/');
});
//CREATE AN APIISH SETUP

//@route GET /files
//desc display files in json
app.get('/files', (req,res)=>{
  gfs.files.find().toArray((err, files)=>{
    if(!files || files.length === 0){
     return res.status(404).json({
       err: 'Couldnt find any files'
     });
    }
    return res.json(files);
  })
})

//@route GET /files/:filename
//desc display files in json
app.get('/files/:filename', (req,res)=>{
  gfs.files.findOne({filename: req.params.filename}, (err, file)=>{
    if(!file || file.length === 0){
return res.status(404).json({
  err: 'No file exists by that name'
})
    }
    return res.json(file);
  })

});

//@route images
//@desc need to use "CREATEREADSTREAM"from gridfs-stream to get images and display them

//@route GET /image/:filename
//desc display files in json
app.get('/image/:filename', (req,res)=>{
  gfs.files.findOne({filename: req.params.filename}, (err, file)=>{
    if(!file || file.length === 0){
return res.status(404).json({
  err: 'No file exists by that name'
})
    }
    //check if image
    if(file.contentType === 'image/jpeg' || file.contentType === "image/png" || file.contentType === 'image/jpg'){
//read output to browser
const readstream = gfs.createReadStream(file.filename);
readstream.pipe(res);
} else {
      res.status(404).json({
        err:'not a image'
      })
    }
  })

});

//@route DELETE /file/:id
 app.delete('/file/:id', (req,res)=>{
//to remove youll need to use gridfs stream's remove
gfs.remove({_id: req.params.id, root:'uploads'}, (err, gridStore)=>{
if(err){
  return res.status(404).json({err: err})
}
res.redirect('/');
})
 })


const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`))