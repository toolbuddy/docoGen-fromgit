const nodegit = require('nodegit'),
	jsfs = require('jsonfile'),
	path = require('path'),
	fs = require('fs');

// Module
const docogen_fromgit = {};

var waiting; // timer

// Get Commits
function getCommits(src_path,result_f_name){
	var flag = -100, counter = 0, commit_history = { arr:[] };
	return new Promise((resolve, reject) => {
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
				// Per commit
				var commit_obj = {
					commit: commit.sha(),
					author: { name: commit.author().name(), email: commit.author().email() },
					date: commit.date(),
					message: commit.message(),
					files: []
				}
				commit.getDiff().then(function(diffList){
					diffList.forEach(function(diff) {
						diff.patches().then(function(patches) {
							patches.forEach(function(patch) {
								patch.hunks().then(function(hunks) {
									hunks.forEach(function(hunk) {
										var files_obj = {
											old: patch.oldFile().path(),
											new: patch.newFile().path(),
											diffnum: hunk.header().trim()
										}
										hunk.lines().then(function(lines) {
											// Write detail 
											/*lines.forEach(function(line) {
												console.log(String.fromCharCode(line.origin()) +
													line.content().trim());
												cur_element.detail += String.fromCharCode(line.origin()) + line.content().trim()+"\n";
											});*/
											// count 1
											commit_obj.files.push(files_obj)
											commit_history.arr.push(commit_obj)
											counter++;
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
			waiting = setInterval(function(){
				if(counter == flag){
					resolve({ msg:"Waiting...", f_name: result_f_name });
					console.log(`Counter: ${counter}, Flag: ${flag}`);
					// Write into the file
					jsfs.writeFileSync(result_f_name,commit_history,{spaces: 2});
					// Close timer 
					clearInterval(waiting);
				}
				else{
					console.log(`Counter: ${counter}, Flag: ${flag}`);
					flag = counter;
				}
			},100)
		})
	})
}

// Get All Info of source 
docogen_fromgit.getAllInfo = function( src,fout_n ){
	return new Promise( (resolve,reject) => {
		getCommits(src,fout_n)
			.then( ({ msg,f_name }, wrong) => {
				console.log(msg);
				resolve({
					msg: "[getAllInfo] Write File Complete!",
					fout_n: f_name,
					info: jsfs.readFileSync(f_name)
				});
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