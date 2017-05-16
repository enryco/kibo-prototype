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

var email = 'none';
var uid = 'none';

/****************************
  Global
  ***************************/

//Post Template
function displayPost(title, preview, target, id) {
  let button = '';
  let clickfunction = `displayPostDetail('${id}','${target}')`
  if (id) {
    button = `<button class="btn btn-primary" onclick="${clickfunction}" role="button" id="button${id}">Weiterlesen</button>`
  };
  let post =
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
  if(typeof newPost == 'function') $('#newEntry').removeClass('invisible').on('click',newPost)
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

//Load Calendar view
function displayCalendar() {
  cleanUpUI();
  $("#pageTitle").html("Kita Termine");
  if(typeof newEvent == 'function') $('#newEntry').removeClass('invisible').on('click',newEvent)
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
    var chatRef = database.ref(devRef+'/chats/' + chatID);
    chatRef.once('value').then( function(snapshot){
      snapshot.child('messages').forEach(function(childSnapshot){
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

      //update readBy status of current user
      chatRef.child('readBy').update( { [uid] : true })

      let readByList = `<ul style="list-style: none" class="text-center text-success">`
      snapshot.child('readBy').forEach( user => {
        readByList += `<li><i class="fa fa-check-circle-o" aria-hidden="true"></i> ${senderNames[user.key]}</li>`
        // $('#pageContent').append(`${senderNames[user.key]}`)
      })
      if(!snapshot.child('readBy').child(uid).exists()){
          readByList += `<li><i class="fa fa-check-circle-o" aria-hidden="true"></i> ${senderNames[uid]}</li>`
      }
      readByList += '</ul>'
      $('#pageContent').append(readByList)

      chatBadge();

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
  $('#pageTitle').html('Chats')
  document.getElementById('navbar-chat').style.display = 'none';
  let list = `<div class="list-group" id="chatsGroup"></div>`
  $('#pageContent').html(list)

  //get all chats and appent them to the list
  function chatElement(chatKey,header,timestamp,content = '',name = '', read = true) {
    let timeFromNow = timestamp ? moment(timestamp).fromNow() : 'undefined'
    if(content.split('').lenth > 30) {content = content.split('').slice(0,30).join('')}
    let dot = !read ? '<i class="fa fa-circle text-primary" aria-hidden="true"></i> ' : ''
    let html = `<a href="#" class="list-group-item list-group-item-action flex-column align-items-start" onclick="displayChat('${chatKey}')">
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">${header}</h5>
        <small class="text-muted">${timeFromNow}</small>
      </div>
      <small class="text-muted">${dot}${name}: ${content}</small>
    </a>`
    $('#chatsGroup').append(html)
  }
  //get all chats the user is in
  database.ref(devRef+`/users/${uid}/chats`).once('value')
    .then( snapshot => {
      snapshot.forEach( childSnapshot => {
        let chatKey = childSnapshot.key
        database.ref(devRef+`/chats/${chatKey}/`).once('value').then( snapshot => {
          let famName = snapshot.val().familyName
          let content = snapshot.child('lastMessage').child('content').val()
          let name = snapshot.child('lastMessage').child('senderName').val()
          let timestamp = snapshot.child('lastMessage').child('timestamp').val()
          let read = snapshot.child('readBy').hasChild(uid)
          chatElement(chatKey,famName,timestamp,content,name, read)
        })
      })
    });
}

function chatBadge() {
  var counter = 0;

  //get all chats the user is in
  database.ref(devRef+`/users/${uid}/chats`).once('value')
  .then( snapshot => {
    snapshot.forEach( childSnapshot => {
      let chatKey = childSnapshot.key
      database.ref(devRef+`/chats/${chatKey}/`).once('value').then( snapshot => {
        if(!snapshot.child('readBy').hasChild(uid)) {
          counter++;console.log('++')
        }
        $('#chatBadge').html(counter == 0 ? '' : counter);
      })//end then
    })//end for each
  })//end then

}

//Send New Message
function pushMessageToFirebase(chatID, senderID, receiverIDs, message, broadcastChild) {
  if (!(chatID && senderID && receiverIDs && message)) {
      return false;
  };
  //strip message from potential html
  message = $("<div>").html(message).text()

  //var uid = uid;
  var chatRef = database.ref(devRef+'/chats/' + chatID); //get chat-messages reference
  //var userRef = database.ref(devRef+'/users/' + senderID + '/chats/' + chatID);
  //
  //check wether chat is broadcast
  //if broadcast ->  send as broadcast
  if(broadcastChild !== true) {
    chatRef.child('broadcast').once('value').then( broadcast => {
      if(broadcast.exists() && broadcast.val()) {
        //send as broadcast
        //get list of receiver chats
        chatRef.child('chats').once('value').then( chats => {
          chats.forEach( chat => {
            // console.log(chat.key)
            if(chat.key != chatID) {
              pushMessageToFirebase(chat.key, senderID, 'none', message, true)
            }
          })
        })
      }
    })
  }

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
    chatRef.child('readBy').set({});

    if (!broadcastChild) { displayChat(chatID); } //Reload Chat View -> Later: Check if message has arrived @DB and APPEND to current view

  });

  return true; //implement firebase method to validate made db entries
}

function sendMessage(chatID) {
  //
  var senderID = uid; //get user id
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

  var userName = getSenderName(uid);
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
var counter = (function () {
    let counter = 0;
    return function () {return ++counter;}
})();

function checkAdmin() {
  if(counter() === 1) {
    database.ref(devRef+`/users/${uid}/daycares`).once('value')
    .then(daycares => {
      daycares.forEach((daycare) => {
        let key = daycare.key
        database.ref(devRef+`/daycares/${key}/admin/${uid}`).once('value')
        .then( snapshot => {
          if (snapshot.exists()) {
            $.getScript( "./js/admin.js" )
            .done(function( script, textStatus ) {
              document.getElementById('admin').style.display = '';
              document.getElementById('newEntry').style.display = '';
              $('#admin').on('click', showDaycare);
            })
            .fail(function( jqxhr, settings, exception ) {
              // console.log( jqxhr );
            });
          }
        })
      })
    })
  } else { return console.error('This has already been called')}
}



/*************************
  APP FUNCTIONS
  ************************/

//Clean Up Page Content
function cleanUpUI() {
  // console.log('Callee:',arguments.callee.caller.name)
  if(arguments.callee.caller.name !== 'displayChats' && arguments.callee.caller.name !== 'displayChat') {chatBadge(); }
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

      // User is signed in.
      var displayName = user.displayName;
      email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      uid = user.uid;
      var providerData = user.providerData;

      document.getElementById('login-screen').style.display = 'none'; //Hide login ccreen if user is signed-In
      document.getElementById('main-view').style.display = '';
      document.getElementById('navbar-view').style.display = '';

      checkAdmin()
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

  // $('#email').val('e.scherlies@me.com');

  //Add Event Listenesrs
  // document.getElementById('signOutButton').addEventListener('click',signOut,false);
  document.getElementById('signInButton').addEventListener('click',signIn,false);

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
