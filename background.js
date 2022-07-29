function addToListCB (downloadItem, imgURL) {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
		let url = tabs[0].url;
		let title = tabs [0].title ;
		console.log (tabs [0])
    data = {
      "name": title + ".mp4",
      "url": downloadItem.finalUrl.replaceAll ("&","@"),
      "poster": imgURL
    }

    var formData = new FormData();
    formData.append( "json", JSON.stringify( data ) );


		// use `url` here inside the callback because it's asynchronous!
		fetch("https://qsx.app/add.php", {
			headers: new Headers({
				Accept:"application/json, application/xml, text/plain, text/html",
        "Content-type": "application/json"
			  }),
			method: "POST",
      body: formData,
			credentials: 'include',
			mode: 'cors'
		  })
			.then((res) => {		
				console.log (res)	  
				chrome.downloads.cancel(
					downloadItem.id
				  )

                if (res.status > 300 /* hack*/) {
                    options = {
                        iconUrl : "https://qsx.app/logo.png",
                        title : "Authentication failed",
                        type : "basic"
                    }

                    if (res.status == 403)
                        options ["message"] = "User not logged in [403]"

                    if (res.status == 500)
                        options ["message"] = "Server error [500]"
    
                    chrome.notifications.create(
                        Date (),
                        options                    
                    )                          
                }

			    return res.text()
			})
			.then((html) => {
                console.log (html)
                json = JSON.parse (html)
                if (! ("files" in json)) {
                    return ;
                }
				  
                options = {
                    iconUrl : "https://qsx.app/logo.png",
                    title : title,
                    message : "[" + json ["files"] + "] Item Added",
                    type : "basic"
                }

                chrome.notifications.create(
                    Date (),
                    options                    
                )
				  

            })
			.catch(function (err) {
			  console.log("Problem");
			  console.log(err);
                var opt = {
                    type: "basic",
                    title: "URL not added",
                    message: err.toString(),
                    iconUrl: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/close/default/48px.svg"
                }
			})
			
	});

	console.log (downloadItem)
}

function getImg () {
  return document.getElementsByTagName("picture")[0].firstChild.src
}

function getVideo () {
  return document.getElementsByTagName("video").src
}

function addToList (downloadItem) {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
		tabId = tabs[0].id;
    chrome.scripting.executeScript(
      {
        target: {tabId: tabId, allFrames: true},
        func: getImg,
      },
      (injectionResults) => {
        addToListCB (downloadItem, injectionResults)
      });  
  
  })

}

function addToListFromPage () {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
		tabId = tabs[0].id;
    chrome.scripting.executeScript(
      {
        target: {tabId: tabId, allFrames: true},
        func: getVideo,
      },
      (injectionResults) => {
        addToList (injectionResults)
      });  
  
  })

}

chrome.downloads.onCreated.addListener(
  addToList
)

chrome.commands.onCommand.addListener((command) => {
  console.log(`Command: ${command}`);
  if (command == "addToList")
    addToListFromPage ()
});