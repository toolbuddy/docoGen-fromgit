const nodegit = require('nodegit'),
	jsfs = require('jsonfile'),
	path = require('path'),
	fs = require('fs');

// Module
const docogen_fromgit = {};

// Get Commits
function getCommits(src_path,result_f_name){
	jsfs.writeFileSync(result_f_name+".lock",{ arr:[] },{spaces: 2});
	return new Promise((resolve, reject) => {
		// nodegit.Repository.open(path.resolve(__dirname, "../docoGen/.git"))
		nodegit.Repository.open(src_path)
		.then(function(repo) {
			// Get total 
			return repo.getMasterCommit();
		})
		.then(function(firstCommitOnMaster){
			// History returns an event.
			var history = firstCommitOnMaster.history(nodegit.Revwalk.SORT.Time);
			// History emits "commit" event for each commit in the branch's history
			history.on("commit", function(commit) {
				commit.getDiff().then(function(diffList){
					diffList.forEach(function(diff) {
						diff.patches().then(function(patches) {
							patches.forEach(function(patch) {
								patch.hunks().then(function(hunks) {
									hunks.forEach(function(hunk) {
										hunk.lines().then(function(lines) {
											// Read File
											const current = jsfs.readFileSync(result_f_name+".lock");
											// Construct object
											let cur_element = { };
											cur_element.commit = commit.sha()
											cur_element.author = { name: commit.author().name(), email: commit.author().email() }
											cur_element.date = commit.date()
											cur_element.message = commit.message()
											cur_element.file = { old: patch.oldFile().path(), new: patch.newFile().path() }
											cur_element.diffnum = hunk.header().trim()
											
											// Write detail 
											/*lines.forEach(function(line) {
												console.log(String.fromCharCode(line.origin()) +
													line.content().trim());
												cur_element.detail += String.fromCharCode(line.origin()) + line.content().trim()+"\n";
											});*/

											// push this element into array
											current.arr.push(cur_element);
											// write back 
											jsfs.writeFileSync(result_f_name+".lock",current,{spaces: 2})
										});
									});
								});
							});
						});
					});
				});
			});
			// Don't forget to call `start()`!
			history.start();
		})
		.done( () => {
			setTimeout(function(){
				resolve({ msg:"Waiting...", f_name: result_f_name });
			},1000)
		})
	})
}

// Get All Info of source 
docogen_fromgit.getAllInfo = function( src,fout_n ){
	return new Promise( (resolve,reject) => {
		getCommits(src,fout_n)
			.then( ({ msg,f_name }, wrong) => {
				console.log(msg);
				// if data has been writing into data, then rename the target files to finished state
				fs.rename(f_name+".lock",f_name,(err) => {
					if(err) reject("[getAllInfo] Write File Error");
					else resolve({
						msg: "[getAllInfo] Write File Complete!",
						fout_n: f_name,
						info: jsfs.readFileSync(f_name)
					});
				})
			})
	})
}

// Get All Info of source, and transfer into docogen
docogen_fromgit.getAllInfo_d = function( src,fout_n ){
	return new Promise( (resolve,reject) =>{ 
		this.getAllInfo(src,fout_n)
			.then( (accept,error) => {
				if(error)  reject(error.msg)
				else{
					// rename 
					fs.rename(accept.fout_n,accept.fout_n.split(".")[0]+".docogen",(err)=>{
						if(err) reject("[getAllInfo_d] Rename File Error");
						else{
							resolve({
								msg: "[getAllInfo_d] Rename File Complete!",
								fout_n: accept.fout_n.split(".")[0]+".docogen",
								info: accept.info
							})
						}
					})
				}
			})	
	})
}

module.exports = docogen_fromgit;