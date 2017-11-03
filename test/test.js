var docogen_fromgit = require('../main'),
    path = require('path');

// Example of getting all information info 

docogen_fromgit.getAllInfo(path.resolve(__dirname, "../.git"),"output.json")
    .then( (resolve,reject) =>{
        if(reject) console.log(reject);
        else{
            console.log("Message: "+resolve.msg);
            // console.dir(resolve.info); // entire obj of src (.../.git)
        }
    })

// Example of getting all information info & rename file extension with .docogen
/*
docogen_fromgit.getAllInfo_d(path.resolve(__dirname, "../.git"),"output.json")
    .then( (resolve,reject) =>{
        if(reject) console.log(reject);
        else{
            console.log("Message: "+resolve.msg);
            // console.dir(resolve.info); // entire obj of src (.../.git)
        }
    })

*/