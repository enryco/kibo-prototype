//shortcuts
//var pageContent = document.getElementById('pageContent');
var database = firebase.database();



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
  var kitaUpdatesRef = database.ref('kitaUpdates');
  var postTitle = document.getElementById('new-post-title');
  var postPreview = document.getElementById('new-post-preview');
  // var postContent = document.getElementById('new-post-content'); //No longer needed
  var postContent = CKEDITOR.instances.newPostContent.getData(); //get Data of CKEDITOR
  console.log(postContent + '---' + postTitle.value)
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
function displayPost(title, preview, content, id) {
  var button = '';
  var clickfunction = "displayPostDetail('" + id + "')";
  if (id) {
    button = '<button class="btn btn-primary" onclick="' +
      clickfunction +
      '" role="button" id="button' + id + '" > Weiterlesen </button>'
  };

  //Slice Content
  // if (content.length > 99) { //okay for text only -> for html content use different algorithm OR have extra DB Child Entry "shortDescribtion"
  //   content = content.slice(0,100) + '...';
  // } else { button = ''; };

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
function displayPostDetail(id) {
  //cleanUpUI(); //turned off as new content and title are passed
  var backButton = '<br><br><button class="btn btn-primary" role="button" onclick="displayKitaUpdates()">Zurück</button>';
  var postRef = database.ref('kitaUpdates/' + id);
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
  document.getElementById('new-post-button').style.display = '';
  var content = '';
  var kitaUpdatesRef = database.ref('kitaUpdates').orderByKey();//.push({title:'feuer'});
  //pageContent.innerHTML += postTemplate('Test',kitaUpdates.once('value').val());
  kitaUpdatesRef.once("value")
  .then(function(snapshot){
    snapshot.forEach(function(childSnapshot){
      var postID = childSnapshot.key;
      var postTitle = childSnapshot.val().title;
      var postContent = childSnapshot.val().content;
      var postPreview = childSnapshot.val().preview;
      var post = displayPost(postTitle,postPreview,postContent,postID);
      var currentContent = $('#pageContent').html();
      var newContent = post + currentContent;
      $('#pageContent').html(newContent);
      if (postContent.length > 99) {
        // document.getElementById('button' + postID).addEventListener('click',function() {displayPostDetail(postID)},false);
        // $('#button' + postID).click(function() {displayPostDetail(postID)});
    };
    })
  });

}

/********************
 CALENDAR
 *********************/

 //Post Template
 function displayEvent(title, preview, content, id) {
   var button = '';
   var clickfunction = "displayEventDetail('" + id + "')";
   if (id) {
     button = '<button class="btn btn-primary" onclick="' +
       clickfunction +
       '" role="button" id="button' + id + '" > Weiterlesen </button>'
   };

   //Slice Content
   // if (content.length > 99) { //okay for text only -> for html content use different algorithm OR have extra DB Child Entry "shortDescribtion"
   //   content = content.slice(0,100) + '...';
   // } else { button = ''; };

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

 //Display Post Details
 function displayEventDetail(id) {
   //cleanUpUI(); //turned off as new content and title are passed
   var backButton = '<br><br><button class="btn btn-primary" role="button" onclick="displayCalendar()">Zurück</button>';
   var postRef = database.ref('calendarEvents/' + id);
   postRef.once('value').then(function(snapshot){
     var title = snapshot.val().title;
     var content = snapshot.val().content;
     $('#pageContent').html(content + backButton);
     $('#pageTitle').html(title);
   });
 }


 //Create New Event
 function newEvent() {
   cleanUpUI();
   document.getElementById('new-event').style.display = '';
 }

 //Push New Post To Database & Load view
 function pushEventPost() {

   var kitaUpdatesRef = database.ref('calendarEvents');
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
  document.getElementById('new-event-button').style.display = '';
  database.ref('calendarEvents').orderByChild('date').once("value")
    .then(function(snapshot) {
      snapshot.forEach(function(childSnapshot){
        var title = childSnapshot.val().title;
        var preview = childSnapshot.val().preview;
        var id = childSnapshot.key;
        // var eventTitle = childSnapshot.val().title;
        var eventContent = childSnapshot.val().content;
        var post = displayEvent(title, preview, undefined, id); //title, preview, content, id
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
      sendMessage();
    }
}

//get sender name
function getSenderName(senderID) {
  // var senderName = '';
  return database.ref('users/' + senderID).once('value').then(function(snapshot) {
      return snapshot.child('name').val();
      // return senderName;
      // console.log(senderName);
  });
  // return senderName;
}

//DiplayChat
function displayChatView() {
  cleanUpUI();
  $('#pageTitle').html('Chat');
  // document.getElementById('navbar-view').style.display = 'none';
  document.getElementById('navbar-chat').style.display = '';
  //displayChats();

  //display single Team Chat for Test-Phase
  var chatID = '-KgjXsexQJEG-zFcR1aE'
  var chatRef = database.ref('/chats/' + chatID + '/messages').orderByKey();
  chatRef.once('value').then( function(snapshot){
    snapshot.forEach(function(childSnapshot){
      var messageID = childSnapshot.key;
      var content = childSnapshot.val().content;

      //sender Name
      var senderID = childSnapshot.val().sender;
      var senderName = childSnapshot.val().senderName;

      // console.log(senderName)
      //time
      var timestamp = childSnapshot.val().timestamp;
      var timeObj = new Date(timestamp);
      time = timeObj.toLocaleString();

      var header = senderName + ' - ' + time;
      var messageHTML = displayMessage(content,header);

      $('#pageContent').append(messageHTML);
      // var header = senderName + ' - ' + time;
      // var messageHTML = displayMessage(content,header);
      // $('#pageContent').append(messageHTML);
    });
  });

  $('body').css('padding-bottom','120px');
  setTimeout(function(){
    window.scrollBy(0,document.getElementById('pageContent').scrollHeight);
  }, 200);
}



//Send New Message
function pushMessageToFirebase(chatID, senderID, receiverIDs, message) {
  if (!(chatID && senderID && receiverIDs && message)) {
      return false;
  };
  //var uid = firebase.auth().currentUser.uid;
  var chatRef = database.ref('chats/' + chatID + '/messages'); //get chat-messages reference
  //var userRef = database.ref('users/' + senderID + '/chats/' + chatID);
  //
  var chatJSON = {};
  var name = getSenderName(senderID);
  Promise.all([name]).then(function(results) {
    chatJSON = {
      content: message,
      sender : senderID,
      senderName : results[0],
      timestamp : firebase.database.ServerValue.TIMESTAMP
      // receiver :
      //   receiverIDs
      //timestamp
    };
    chatRef.push(chatJSON);
    displayChatView(); //Reload Chat View -> Later: Check if message has arrived @DB and APPEND to current view

  });

  return true; //implement firebase method to validate made db entries
}


function sendMessage(chatID) {
  //
  var senderID = firebase.auth().currentUser.uid; //get user id
  var message = document.getElementById('chat-message-input'); //message form id
  if (!message.value) { return alert('Nachricht darf nicht leer sein')};
  //var chatID = database.ref('user/' + senderID + '/chats'); //get reference to chat
  //[TO-DO] get actual chatID
  var chatID = '-KgjXsexQJEG-zFcR1aE'; //für testzwecke!
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


/*************************
  APP FUNCTIONS
  ************************/

//Clean Up Page Content
function cleanUpUI() {
  $('#pageContent').html('');
  $('body').css('padding-bottom','70px');
  document.getElementById('new-post').style.display = 'none';
  document.getElementById('new-event').style.display = 'none';

  document.getElementById('navbar-chat').style.display = 'none';
  document.getElementById('navbar-view').style.display = '';
  document.getElementById('new-post-button').style.display = 'none';
  document.getElementById('new-event-button').style.display = 'none';

}


//App initialization - fires everytime the document is load
function initApp() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
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
      document.getElementById('new-post-button').style.display = 'none';

      //specify init view
      // displayKitaUpdates();
      // displayChatView();
      displayCalendar();
      newEvent();

    } else {
      // User is signed out.
      document.getElementById('login-screen').style.display = ''; //Show login screen if user is signed-Out
      document.getElementById('main-view').style.display = 'none';
      document.getElementById('navbar-view').style.display = 'none';
      document.getElementById('new-post-button').style.display = 'none';
    } //end if
  }); //end of mehtod

  $('#email').val('e.scherlies@me.com');


  //Add Event Listenesrs
  // document.getElementById('signOutButton').addEventListener('click',signOut,false);
  document.getElementById('signInButton').addEventListener('click',signIn,false);
  document.getElementById('new-post-button').addEventListener('click',newPost,false);
  document.getElementById('new-event-button').addEventListener('click',newEvent,false);

  document.getElementById('kita-updates-push-button').addEventListener('click',pushNewPost,false);
  document.getElementById('kita-event-push-button').addEventListener('click',pushEventPost,false);

    //Navigation Buttons
  document.getElementById('home-button').addEventListener('click',displayKitaUpdates,false);
  document.getElementById('calendar-button').addEventListener('click',displayCalendar,false);
  document.getElementById('chat-button').addEventListener('click',displayChatView,false);
  document.getElementById('user-button').addEventListener('click',displayUser,false);
  document.getElementById('message-send-button').addEventListener('click',sendMessage,false);
  // document.getElementById('home-button').addEventListener('click',displayKitaUpdates,false);

  // $('#signInButton').on('click',signIn);
}


// $(document).ready(function() {
// });


window.onload = function() {
  initApp();
};
