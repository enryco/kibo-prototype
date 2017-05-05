//default app
var config = {
  apiKey: "AIzaSyC4MrEMoGv3oB5s-QOL_0EgmDiCdSCznqc",
  authDomain: "kita-app-48708.firebaseapp.com",
  databaseURL: "https://kita-app-48708.firebaseio.com",
  storageBucket: "kita-app-48708.appspot.com",
  messagingSenderId: "994027603927"
};
firebase.initializeApp(config);

//second app for admin reasons…
var taube = firebase.initializeApp(config, 'taube');

//shortcuts
//var pageContent = document.getElementById('pageContent');
var database = firebase.database();

/********************
Show Family DB Tree
*********************/

function showFamilies() {
  cleanUpUI()
  firebase.database().ref('families/').once('value').then(function(snapshot){
    snapshot.forEach(function(childSnapshot){
      let familyTemplate = `<p>- ${childSnapshot.val().name}</p>`
      $('#pageContent').append(familyTemplate)
    })
  })
}

/********************
New Family
*********************/

function addTemplate(target) {
  // target = kid || adult

  //set target Template to render to using jQuery
  var template = '#' + target + 'Templates'

  //Check if there is already an element and if so increase count by one
  var count = 0 //Start Counting Target Elements from Zerooooooo
  while (document.getElementsByClassName(target+count).length) {
    count += 1
  }
  var identifier = target + count //merge target and count to one variable with syntax 'target0', 'target1', ..

  //if target = child -> no email
  //TODO: change var email to an general name like thirdField
  //TODO: before deploy, change values to ''
  var option = ''
  if (target != 'kid') {
    option = `<div class="col-2">E-Mail</div><div class="col-10"><input type="text" class="${identifier} form-control" id="${identifier}EMail" value="testUser${count}@enricoscherlies.de"></div>`
  } else {
    option = `<div class="col-2">Gruppe</div><div class="col-6"><input type="text" class="${identifier} form-control" id="${identifier}Group" value="" disabled></div>
    <div class="btn-group col-4">
    <button type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    Gruppe...
    </button>
    <div class="dropdown-menu dropdown-groups-${identifier}">
    <div class="dropdown-divider"></div>
    <button class="dropdown-item" href="#" onclick="">Neue Gruppe</button>
    </div>
    </div>`

  }

  //prepare html
  var html = `<div class="row">
  <div class="col-2">Vorname</div><div class="col-10"><input type="text" class="${identifier}   form-control" id="${identifier}Firstname" value="${identifier}Firstname"></div>
  <div class="col-2">Nachname</div><div class="col-10"><input type="text" class="${identifier}   form-control" id="${identifier}Lastname" value="${identifier}Lastname"></div>
  ${option}
  </div>
  <br>`

  $(template).append(html)

  if (target == 'kid') {
    database.ref(`/users/${firebase.auth().currentUser.uid}/daycares`).once('value')
    .then( snapshot => {
      snapshot.forEach( cS => {
        let daycareKey = cS.key
        database.ref(`daycares/${daycareKey}/groups`).once("value")
        .then( snapshot2 => {
          console.log(snapshot2.key)
          snapshot2.forEach( cs2 => {
            console.log(cs2.val().name)
            let groupKey = cs2.key
            let groupName = cs2.val().name
            let button = `<button class="dropdown-item" href="#" onclick="selectGroup('${identifier}','${groupKey}','${groupName}')">${groupName}</button>`
            $('.dropdown-groups-'+identifier).prepend(button)
          })//end forEach
        })//end then
      })//end for each
    })//end then
  }//end if

}//end addTemplate

function selectGroup(identifier,groupKey,groupName) {
  let groupElement = document.getElementById(identifier + 'Group')
  groupElement.value = groupName
  groupElement.setAttribute('groupkey',groupKey)
}//end selectGroup

function newFamily() {
  var html = `
  <h1>Neue Familie</h1>
  <div class="row">
  <div class="col-2">Familienname</div>
  <div class="col-10"><input type="text" class="form-control" id="familyName" value="Fam ${Math.floor(Math.random()*1000)}"></div>
  </div>
  <hr>
  <h3>Elternteile:</h3>
  <div class="adultTemplates" id="adultTemplates">
  </div>
  <button class="btn btn-primary" role="button" id="newFamily" onclick="addTemplate('adult')"><i class="fa fa-plus"></i> Elternteil</button>
  <hr>
  <h3>Kind(er)</h3>
  <div class="childTemplates" id="kidTemplates">
  </div>
  <button class="btn btn-primary" role="button" id="" onclick="addTemplate('kid')"><i class="fa fa-plus"></i> Kind</button>
  <hr>
  <button class="btn btn-success" role="button" id="done" onclick="pushFamilyToFirebase()"><i class="fa fa-check"></i> Fertig</button>
  <button class="btn btn-danger" role="button" id="done" onclick="cleanUpUI()"><i class="fa fa-times"></i> Abbrechen</button>
  `
  $('#newFamilyTarget').html(html)
  addTemplate('adult')
  addTemplate('kid')
  document.getElementById('pageContent').style.display = 'none'

}

function pushAdults(familyKey, familyName) {
  // FUNCTION to set adult entries to db
  var count = 0
  var target = 'adult'
  var adults = {}
  var callCenter = [] //use to gather all promisses from while loop

  function createNewUser(email,firstname,lastname,familyKey) {
    let adult = {
      lastname,
      firstname,
      fullname : `${firstname} ${lastname}`,
      email,
      familyKey
    }
    //create actual user w/ random pw
    //using second firebase app for signin up new user
    let temporaryPassword = firebase.database().ref().push().key //use a key to set pw
    let newUser = taube.auth().createUserWithEmailAndPassword(email, temporaryPassword).then(function(newUser) {

      //change users displayName
      taube.auth().currentUser.updateProfile({ displayName : firstname }).then( _ =>  console.log('Username Changed'))

      //make db entry of adult properties
      firebase.database().ref('/users/'+newUser.uid).set(adult)

      //make list for family/adults
      adults[newUser.uid] = true

      //delete user to allow smooth developement
      taube.auth().currentUser.delete().then(function() {  console.log('User deleted')     }, function(error) { /* An error happened. */ })

    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code
      var errorMessage = error.message
      console.log(error.message)
      return false
      // ...
    });

    //append newUser (Promise) to callCenter
    callCenter.push(newUser)

  }
  //iterate over adultTemplates
  //gather in neat JSON
  while (document.getElementById(target+count+'Lastname') !== null) {
    // let adultKey = firebase.database().ref().push().key
    let lastname = document.getElementById(target+count+'Lastname').value
    let firstname =  document.getElementById(target+count+'Firstname').value
    let email = document.getElementById(target+count+'EMail').value

    createNewUser(email,firstname,lastname,familyKey)
    count += 1
  }


  //wait for everyone to have us called back
  Promise.all(callCenter).then(function(){
    //sign last taube user out
    taube.auth().signOut()

    //newChat TODO get chat out of this messy function
    let chatUsers = {}
    chatUsers = JSON.parse(JSON.stringify(adults))
    chatUsers[firebase.auth().currentUser.uid] = true
    newChat(chatUsers, familyName)
    return firebase.database().ref('/families/' + familyKey + '/adults/').set(adults)
  }).catch(error => { console.log(error.message)} )
}

function pushKids(familyKey) {
  //iterate over kidTemplates
  //gather in neat JSON
  var count = 0
  var target = 'kid'
  var kids = {}
  while (document.getElementById(target+count+'Lastname') !== null) {
    let newKey = firebase.database().ref().push().key
    let lastname = document.getElementById(target+count+'Lastname').value
    let firstname =  document.getElementById(target+count+'Firstname').value
    let group = document.getElementById(target+count+'Group').value
    kids[newKey] = {
      lastname,
      firstname,
      group
    }
    count += 1
  }
  return firebase.database().ref().child('families/' + familyKey + '/kids').set(kids)
}

function pushFamilyToFirebase(familyKey) {
  //first, disable button to prevent multiple pushes
  document.getElementById('done').disabled = true

  //if no key is provided, generate new family key
  if (familyKey === undefined) {
    var familyKey = firebase.database().ref().child('families').push().key
  }
  var familyName = document.getElementById('familyName').value
  //write familyname to family entry
  var family = {
    name : familyName
    // members
  }

  //push family base to firebase
  let p1 = firebase.database().ref().child('families/'+familyKey).set(family)
  let p2 = pushAdults(familyKey, familyName)
  let p3 = pushKids(familyKey)

  //wait for all to be sovled
  Promise.all([p1, p2, p3]).then(function(){
    cleanUpUI()
    showFamilies()
  }).catch(function(e){
    console.log(e)
  })

}

//initialize a new chat
//users must be json containing { user1 : true, ... }
function newChat(users, familyName) {
  //get new chat key
  var chatKey = firebase.database().ref('chats').push().key

  //create participants JSON
  for (let key in users) {
    //add chat id to users/$uid/chats
    firebase.database().ref(`/users/${key}/chats`).update({ [chatKey] : true })
  }

  //initialize chat with paticipants
  firebase.database().ref(`/chats/${chatKey}/users`).set(users)

  //create chat name as familyName
  //as for now: just take the familyname from DOM Element
  firebase.database().ref(`/chats/${chatKey}/`).update({ familyName })

  //initialize welcome message
  var userNames = '<ul>'
  var proms = []
  for (let userId in users) {
    let prom = firebase.database().ref(`/users/${userId}/`).once('value')
    .then( snapshot => {
      userNames += `<li>${snapshot.val().fullname}</li>`
    })
    proms.push(prom)
  }
  Promise.all(proms).then( proms => {
    userNames += '</ul>'
    let message = {
      content : `Willkommen im Chat View! Mitglieder sind ${userNames}`,
      sender : firebase.auth().currentUser.uid,
      senderName : "Admin",
      timestamp : firebase.database.ServerValue.TIMESTAMP
      // receiver :
      //   receiverIDs
      //timestamp
    }
    firebase.database().ref(`/chats/${chatKey}/messages`).push(message)
  })
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
  document.getElementById('pageContent').style.display = ''
  $('#newFamilyTarget').html('')
  $('#pageContent').html('<h3>Familien in der Datenbank:</h3>')
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
      // document.getElementById('navbar-view').style.display = '';

      //load home view with family DB
      showFamilies()

    } else {
      // User is signed out.
      document.getElementById('login-screen').style.display = ''; //Show login screen if user is signed-Out
      document.getElementById('main-view').style.display = 'none';
      // document.getElementById('navbar-view').style.display = 'none';
    } //end if
  }); //end of mehtod

  //dev
  $('#email').val('e.scherlies@me.com');
  $('#password').val('qwer1234');

  //Add Event Listenesrs
  document.getElementById('signOutButton').addEventListener('click',signOut,false);
  document.getElementById('signInButton').addEventListener('click',signIn,false);
  document.getElementById('newFamily').addEventListener('click',newFamily,false);

  // $('#signInButton').on('click',signIn);
}


// $(document).ready(function() {
// });


window.onload = function() {
  initApp();
};
