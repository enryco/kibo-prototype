/*

“Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.”
~ Antoine de Saint-Exupery

*/

// Initialize Firebase
var config = {
  apiKey: "AIzaSyC4MrEMoGv3oB5s-QOL_0EgmDiCdSCznqc",
  authDomain: "kita-app-48708.firebaseapp.com",
  databaseURL: "https://kita-app-48708.firebaseio.com",
  storageBucket: "kita-app-48708.appspot.com",
  messagingSenderId: "994027603927"
};
firebase.initializeApp(config);

//shortcuts
//var pageContent = document.getElementById('pageContent');
var database = firebase.database();

//developer mode?
var devRef = true ? '/1' : ''

//init locale time
moment.locale('de')

/*************************
  CURATOR - NEW Post
  ************************/

//Create New Post
function newPost() {
  cleanUpUI();
  document.getElementById('new-post').style.display = '';
}

//Push New Post To Database & Load view
function pushNewPost() {
  var kitaUpdatesRef = database.ref(devRef+'/kitaUpdates');
  var postTitle = document.getElementById('new-post-title');
  var postPreview = document.getElementById('new-post-preview');
  // var postContent = document.getElementById('new-post-content'); //No longer needed
  var postContent = CKEDITOR.instances.newPostContent.getData(); //get Data of CKEDITOR
  if (postContent && postTitle.value && postPreview.value) {
    kitaUpdatesRef.push({
      title : postTitle.value,
      preview : postPreview.value,
      content : postContent,
      uid: firebase.auth().currentUser.uid,
      timestamp : firebase.database.ServerValue.TIMESTAMP
    });
    document.getElementById('new-post').style.display = 'none';
    displayKitaUpdates();
    postTitle.value = '';
    postContent.value = '';
  } else {
    alert('Bitte Titel und Inhalt eingeben');
  }
}

//Post Template
function displayPost(title, preview, target, id) {
  var button = '';
  if (target == 'post') {
    var clickfunction = `displayPostDetail('${id}','post')`
  } else if (target == 'event') {
    var clickfunction = `displayPostDetail('${id}','event')`
  } else {
    return Error('Target not defined')
  }

  if (id) {
    button = '<button class="btn btn-primary" onclick="' +
      clickfunction +
      '" role="button" id="button' + id + '" > Weiterlesen </button>'
  };

  var post =
    '<p>' +
      '<div class="card">' +
        '<h4 class="card-header">' + title + '</h4>' +
        '<div class="card-block">' +
          //'<h4 class="card-title">' + title + '</h4>' +
          '<p class="card-text">'+ preview + '</p>' +
          button +
        '</div>' +
      '</div>' +
    '</p>';
  return post;
}


/****************************
  KITA UPDATES
  ***************************/

//Display Post Details
function displayPostDetail(id, target) {
  if (target == 'post') {
    var backButton = '<br><br><button class="btn btn-primary" role="button" onclick="displayKitaUpdates()">Zurück</button>';
    var postRef = database.ref(devRef+'/kitaUpdates/' + id);
  } else if (target == 'event') {
    var backButton = '<br><br><button class="btn btn-primary" role="button" onclick="displayCalendar()">Zurück</button>';
    var postRef = database.ref(devRef+'/calendarEvents/' + id);
  } else {
    return Error('Target not defined')
  }
  console.log(target)
  postRef.once('value').then(function(snapshot){
    var title = snapshot.val().title;
    var content = snapshot.val().content;
    $('#pageContent').html(content + backButton);
    $('#pageTitle').html(title);
  });
}

//load kitaUpdates
function displayKitaUpdates() {
  cleanUpUI(); //Clean-Up View
  $("#pageTitle").html("Neues");
  $('#newEntry').removeClass('invisible').on('click',newPost)
  var content = '';
  var kitaUpdatesRef = database.ref(devRef+'/kitaUpdates').orderByKey();//.push({title:'feuer'});
  //pageContent.innerHTML += postTemplate('Test',kitaUpdates.once('value').val());
  kitaUpdatesRef.once("value")
  .then(function(snapshot){
    snapshot.forEach(function(childSnapshot){
      var postID = childSnapshot.key;
      var postTitle = childSnapshot.val().title;
      var postContent = childSnapshot.val().content;
      var postPreview = childSnapshot.val().preview;
      var post = displayPost(postTitle,postPreview,'post',postID);
      var currentContent = $('#pageContent').html();
      var newContent = post + currentContent;
      $('#pageContent').html(newContent);
    })
  });

}


/********************
 CALENDAR
 *********************/

 //Create New Event
 function newEvent() {
   cleanUpUI();
   document.getElementById('new-event').style.display = '';
 }

 //Push New Post To Database & Load view
 function pushEventPost() {

   var kitaUpdatesRef = database.ref(devRef+'/calendarEvents');
   var title = document.getElementById('new-event-title');
   var preview = document.getElementById('new-event-preview');
   var date = document.getElementById('new-event-date');
   var content = CKEDITOR.instances.newEventContent.getData();

   //Check if Date is propperly formated
   date = parseInt(date.value) //Convert DOM Value to Integer
   if (!Number.isInteger(date) || !(date.toString().split('').length === 6)) {
         return alert('Bitte Formatierung des Datums beachten!')
       }

   if (content && title.value) {
     kitaUpdatesRef.push({
       title : title.value,
       content : content,
       preview : preview.value,
       uid : firebase.auth().currentUser.uid,
       timestamp : firebase.database.ServerValue.TIMESTAMP,
       date : date
     });
     document.getElementById('new-event').style.display = 'none';
     displayCalendar();
     title.value = '';
     preview.value = '';
     date.value = '';
     // postContent.value = '';
   } else {
     alert('Bitte Titel und Inhalt eingeben');
   }
 }

//Load Calendar view
function displayCalendar() {
  cleanUpUI();
  $("#pageTitle").html("Kita Termine");
  $('#newEntry').removeClass('invisible').on('click',newEvent)
  database.ref(devRef+'/calendarEvents').orderByChild('date').once("value")
    .then(function(snapshot) {
      snapshot.forEach(function(childSnapshot){
        let time = moment(childSnapshot.val().timestamp).format('ddd,DoMoY')
        let title = childSnapshot.val().title;
        let header = `${time} - ${title}`
        let preview = childSnapshot.val().preview;
        let id = childSnapshot.key;
        // var eventTitle = childSnapshot.val().title;
        let eventContent = childSnapshot.val().content;
        let post = displayPost(header, preview, 'event', id); //title, preview, content, id
        $('#pageContent').append(post);
      })
    })
}


/********************
  CHAT
*********************/

//Chat Messages
function displayMessage(content,sender) {
  if (!(content && sender)) { return false }; //awesome safety feature;
  var post =
    '<p>' +
      '<div class="card">' +
        '<div class="card-block">' +
        '<h6 class="card-subtitle mb-2 text-muted">' + sender + '</h6>' +
          '<p class="card-text">'+ content + '</p>' +
        '</div>' +
      '</div>' +
    '</p>';
  return post;
}

//Handle Enter-to-send
function enterToSend(event) {
    if (event.keyCode == 13) {
      document.getElementById('message-send-button').click();
    }
}

//get sender name
function getSenderName(senderID) {
  // var senderName = '';
  return database.ref(devRef+'/users/' + senderID).once('value').then(function(snapshot) {
      return snapshot.child('firstname').val();
      // return senderName;
      // console.log(senderName);
  });
  // return senderName;
}

//edit message
function editMessage(chatId,messageId,content){
  database.ref(devRef+`/chats/${chatId}/messages/${messageId}`).update({ content, edit : true })
}

//delete message
function deleteMessage(chatId,messageId) {
  database.ref(devRef+`/chats/${chatId}/messages/${messageId}`).set({})
}

//DiplayChat
function displayChat(chatID) {
  cleanUpUI();
  $('#pageTitle').html('Chat');
  // document.getElementById('navbar-view').style.display = 'none';
  document.getElementById('navbar-chat').style.display = '';
  let backButton = document.getElementById('backButton')
  backButton.style.display = '';
  backButton.setAttribute('onclick','displayChats()')

  //displayChats();

  //get sender names, and promises
  var proms = []
  var senderNames = {}
  proms.push(database.ref(devRef+`/chats/${chatID}/users/`).once('value')
    .then( snapshot => snapshot.forEach( childSnapshot => {
      proms.push(database.ref(devRef+`/users/${childSnapshot.key}/`).once('value')
        .then( userName => senderNames[childSnapshot.key] = userName.val().firstname )
      )
    })
  )
  )

  //wait for senderNames
  //display messages
  Promise.all(proms).then( _ => {
    var chatRef = database.ref(devRef+'/chats/' + chatID + '/messages').orderByKey();
    chatRef.once('value').then( function(snapshot){
      snapshot.forEach(function(childSnapshot){
        let messageID = childSnapshot.key;
        let content = childSnapshot.val().content;

        //sender Name
        let senderID = childSnapshot.val().sender;
        let senderName = senderNames[senderID];

        //time
        let timestamp = childSnapshot.val().timestamp;
        let timeFromNow = moment(timestamp).fromNow()

        let header = senderName + ' - ' + timeFromNow;
        let messageHTML = displayMessage(content,header);

        $('#pageContent').append(messageHTML);
      })//end for each
    })//end .then
  })

  document.getElementById('message-send-button').setAttribute('onclick',`sendMessage('${chatID}')`)
  $('body').css('padding-bottom','120px');
  setTimeout(function(){
    window.scrollBy(0,document.getElementById('pageContent').scrollHeight);
    // $('#message-send-button').on('click', _ => sendMessage(chatID))
  }, 200);
}

//Display Chats (esp. for Kilei or later use)
function displayChats() {
  cleanUpUI()
  document.getElementById('navbar-chat').style.display = 'none';
  let list = `<div class="list-group" id="chatsGroup"></div>`
  $('#pageContent').html(list)

  //get all chats and appent them to the list
  function chatElement(chatKey,header,timestamp,content,name) {
    content = content ? content : 'undefined'
    name = name ? name : 'undefined'
    let timeFromNow = timestamp ? moment(timestamp).fromNow() : 'undefined'
    if(content.split('').lenth > 30) {content = content.split('').slice(0,30).join('')}

    let html = `<a href="#" class="list-group-item list-group-item-action flex-column align-items-start" onclick="displayChat('${chatKey}')">
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">${header}</h5>
        <small class="text-muted">${timeFromNow}</small>
      </div>
      <small class="text-muted">${name}: ${content}</small>
    </a>`
    $('#chatsGroup').append(html)
  }
  //get all chats the user is in
  database.ref(devRef+`/users/${firebase.auth().currentUser.uid}/chats`).once('value')
    .then( snapshot => {
      snapshot.forEach( childSnapshot => {
        let chatKey = childSnapshot.key
        database.ref(devRef+`/chats/${chatKey}/`).once('value').then( snapshot => {
          let famName = snapshot.val().familyName
          let content = snapshot.child('lastMessage').child('content').val()
          let name = snapshot.child('lastMessage').child('senderName').val()
          let timestamp = snapshot.child('lastMessage').child('timestamp').val()
          chatElement(chatKey,famName,timestamp,content,name)
        })
      })
    });
}

//Send New Message
function pushMessageToFirebase(chatID, senderID, receiverIDs, message, broadcastChild) {
  if (!(chatID && senderID && receiverIDs && message)) {
      return false;
  };
  //strip message from potential html
  message = $("<div>").html(message).text()

  //var uid = firebase.auth().currentUser.uid;
  var chatRef = database.ref(devRef+'/chats/' + chatID); //get chat-messages reference
  //var userRef = database.ref(devRef+'/users/' + senderID + '/chats/' + chatID);
  //
  //check wether chat is broadcast
  //if broadcast ->  send as broadcast
  chatRef.child('broadcast').once('value').then( broadcast => {
    if(broadcast.exists() && broadcast.val()) {
      //send as broadcast
      //get list of receiver chats
      chatRef.child('chats').once('value').then( chats => {
        chats.forEach( chat => {
          console.log(chat.key)
          if(chat.key != chatID) {
            pushMessageToFirebase(chat.key, senderID, 'none', message, true)
          }
        })
      })
    }
  })
  var chatJSON = {};
  var name = getSenderName(senderID);
  Promise.all([name]).then(function(results) {
    let timestamp = firebase.database.ServerValue.TIMESTAMP
    chatJSON = {
      content: message,
      sender : senderID,
      senderName : results[0],
      timestamp
      // receiver :
      //   receiverIDs
      //timestamp
    };
    chatRef.child('messages').push(chatJSON);
    chatRef.child('lastMessage').set(chatJSON);

    if (!broadcastChild) { displayChat(chatID); } //Reload Chat View -> Later: Check if message has arrived @DB and APPEND to current view

  });

  return true; //implement firebase method to validate made db entries
}

function sendMessage(chatID) {
  //
  var senderID = firebase.auth().currentUser.uid; //get user id
  var message = document.getElementById('chat-message-input'); //message form id
  if (!message.value) { return alert('Nachricht darf nicht leer sein')};
  //var chatID = database.ref(devRef+'/user/' + senderID + '/chats'); //get reference to chat
  //TODO get actual chatID
  // var chatID = '-KjEjimClcMXNV1DtGax'; //für testzwecke!
  var receiverIDjson = 'none';        //für testzwecke
  var status = pushMessageToFirebase(chatID,senderID,receiverIDjson,message.value);
  if (status) {
    $('#new-message-input').val(''); //clear input form of new message
    // displayChatView(); //Reload Chat View -> Later: Check if message has arrived @DB and APPEND to current view
    message.value = '';
  } else {
    //alert('Bitte Titel und Inhalt eingeben');
    //Disable Send Button or so <- muss vorher geschehen
  }

}


/********************
  USER SETTINGS
  *********************/

function userSettingList(userName,eMail) {
  // var userName = 'Kim';
  // var eMail = 'hallo@dm.de';
  var list =
    '<div class="list-group">' +
      '<a href="#" class="list-group-item list-group-item-action disabled">Name: ' + userName + ' </a>' +
      '<a href="#" class="list-group-item list-group-item-action disabled">E-Mail: ' + eMail + '</a>' +
      // '<a href="#" class="list-group-item list-group-item-action disabled">Passwort ändern</a>' +
    '</div>' +
    '<br>' +
    '<a class="btn btn-danger btn-block" href="#" type="" role="" id="signOutButton"><i class="fa fa-power-off" aria-hidden="true"></i> Ausloggen</a>';
  $('#pageContent').html(list);
}

//Display USer Settings
function displayUser() {
  //...
  cleanUpUI();
  $('#pageTitle').html('Einstellungen')

  var userName = getSenderName(firebase.auth().currentUser.uid);
  var email = firebase.auth().currentUser.email;

  Promise.all([userName]).then(function (results){
    userSettingList(results[0],email);
    document.getElementById('signOutButton').addEventListener('click',signOut,false);

  });
}


/********************
  Splash Screen Functions
  *********************/

//Sign-Out Function
function signOut() {
  var user = firebase.auth().currentUser;
  if (user) {
    //$('#output').append('<br>User Signed-In');
    //document.getElementById('login-screen').style.display = 'none';
    firebase.auth().signOut().then(function() {
      console.log('Signed Out');
    }, function(error) {
      console.error('Sign Out Error', error);
    });
  }
  else {
    //$('#output').append('<br>User is signed-Out');
  };
}

// Sign-In Fucntion
function signIn() {
  var user = firebase.auth().currentUser
  if (!user) {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
      alert(errorMessage);
    });
  }
  else {
    firebase.auth().signOut().then(function() {
      console.log('Signed Out');
    }, function(error) {
      console.error('Sign Out Error', error);
    });
  }
}

function resetPassword() {
  var email = document.getElementById('email').value;
  firebase.auth().sendPasswordResetEmail(email).then(function() {
    // Email sent.
    alert('Mail ist raus! :)')
  }, function(error) {
    alert(error)
  });
}

/*************************
  Load Admin Script
  ************************/
function checkAdmin() {
  let uid = firebase.auth().currentUser.uid
  database.ref(devRef+`/users/${uid}/daycares`).once('value')
    .then(daycares => {
      daycares.forEach((daycare) => {
          let key = daycare.key
          database.ref(devRef+`/daycares/${key}/admin/${uid}`).once('value')
            .then( snapshot => {
              if (snapshot.exists()) {
                loadAdmin()
              }
            })
      })
    })

}

function loadAdmin(){

  function initAdminTools() {
      document.getElementById('admin').style.display = '';
      document.getElementById('newEntry').style.display = '';
      $('#admin').on('click', showDaycare)
  }

  if(loadAdmin.counter === 0) {
    $.getScript( "./js/admin.js" )
      .done(function( script, textStatus ) {
        initAdminTools();
      })
      .fail(function( jqxhr, settings, exception ) {
        // console.log( jqxhr );
    });
  } else { return console.error('This has already been called')}

  loadAdmin.counter++
}
loadAdmin.counter = 0

/*************************
  APP FUNCTIONS
  ************************/

//Clean Up Page Content
function cleanUpUI() {
  $('#pageContent').html('');
  $('body').css('padding-bottom','70px');
  $('#newEntry').addClass('invisible')
  document.getElementById('new-post').style.display = 'none';
  document.getElementById('new-event').style.display = 'none';
  document.getElementById('navbar-chat').style.display = 'none';
  document.getElementById('navbar-view').style.display = '';
  document.getElementById('backButton').style.display = 'none';
}

//App initialization - fires everytime the document is load
function initApp() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {

      checkAdmin()
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;


      document.getElementById('login-screen').style.display = 'none'; //Hide login ccreen if user is signed-In
      document.getElementById('main-view').style.display = '';
      document.getElementById('navbar-view').style.display = '';

      //specify init view
      //TODO turn off in deploy
      displayKitaUpdates();
      // displayChats();
      // displayCalendar();
      // newEvent();

    } else {
      // User is signed out.
      document.getElementById('login-screen').style.display = ''; //Show login screen if user is signed-Out
      document.getElementById('main-view').style.display = 'none';
      document.getElementById('navbar-view').style.display = 'none';
    } //end if
  }); //end of mehtod

  $('#email').val('e.scherlies@me.com');

  //Add Event Listenesrs
  // document.getElementById('signOutButton').addEventListener('click',signOut,false);
  document.getElementById('signInButton').addEventListener('click',signIn,false);
  document.getElementById('kita-updates-push-button').addEventListener('click',pushNewPost,false);
  document.getElementById('kita-event-push-button').addEventListener('click',pushEventPost,false);

    //Navigation Buttons
  document.getElementById('home-button').addEventListener('click',displayKitaUpdates,false);
  document.getElementById('calendar-button').addEventListener('click',displayCalendar,false);
  document.getElementById('chat-button').addEventListener('click',displayChats,false);
  document.getElementById('user-button').addEventListener('click',displayUser,false);
  // document.getElementById('message-send-button').addEventListener('click',sendMessage,false);
  // document.getElementById('home-button').addEventListener('click',displayKitaUpdates,false);

  // $('#signInButton').on('click',signIn);
}

window.onload = function() {
  initApp();
};
