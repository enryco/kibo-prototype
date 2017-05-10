//default app
var config = {
  apiKey: "AIzaSyC4MrEMoGv3oB5s-QOL_0EgmDiCdSCznqc",
  authDomain: "kita-app-48708.firebaseapp.com",
  databaseURL: "https://kita-app-48708.firebaseio.com",
  storageBucket: "kita-app-48708.appspot.com",
  messagingSenderId: "994027603927"
};

//try initializing app
try {
  firebase.initializeApp(config);
}
catch(error) {
  //if already initialized, do nothing
}


//second app for admin reasons…
var taube = firebase.initializeApp(config, 'taube');

//shortcuts
//var pageContent = document.getElementById('pageContent');
var database = firebase.database();

//developer helpers
var devRef = true ? '/1' : ''
function cleanDB() {
  database.ref(devRef).set(
    { "daycares" : {
        "-Kjc11ZE6hxX83rfigFA" : {
          "admin" : {
            "cWaGTqcy5eTeLADJKZMCWtzmL9N2" : true
          },
          "name" : "Purzelbaum"
        }
      },
      "users" : {
        "cWaGTqcy5eTeLADJKZMCWtzmL9N2" : {
          "daycares" : {
            "-Kjc11ZE6hxX83rfigFA" : true
          },
          "firstname" : "Enrico",
          "fullname" : "Enrico Scherlies"
        }
      }
    }
  )
}
var rand = function() { return Math.floor(Math.random()*1e4) }

//update an user
function updateUser(uid, attributesObj){
  database.ref(devRef+'/users/'+uid).update(attributesObj)
}

//TODO
function newDaycare(uid, daycareName){

  uid ? addToUser(uid) : createUser()

  function addToUser(uid){
    //
    let daycareKey = database.ref(devRef).push().key
    let obj = {}
    obj[`/users/${uid}/daycares/${daycareKey}`] = true
    obj[`/daycares/${daycareKey}`] = { name : daycareName }
    database.ref(devRef).update(obj)
  }

  function createUser(){
    //steps to create user
    //via taube.

    //if user created:
    addToUser(uid)
  }
}

/********************
Show Family and Group DB Tree
*********************/

function showDaycare() {
  cleanUpUI()
  $('#pageTitle').html('Übersicht')
  let html = `  <!-- Daycare Database Functionalities -->
    <div class="" id="">
        <h3>Gruppen</h3>
        <ul class="" id="groups"></ul>
        <button class="btn btn-primary" role="button" id="newGroup" onclick="newGroup()"><i class="fa fa-plus"></i> Gruppe</button>
        <p></p>
        <h3>Familien</h3>
        <ul class="" id="families"></ul>
        <button class="btn btn-primary" role="button" id="newFamily" onclick="newFamily()"><i class="fa fa-plus"></i> Familie</button>
    </div>`
  $('#pageContent').html(html)
  showFamilies()
}

function showFamilies() {

  //show groups
  database.ref(devRef+`/users/${firebase.auth().currentUser.uid}/daycares`).once('value')
  .then( daycares => {
    daycares.forEach( daycare => {

      //show groups
      database.ref(devRef+`/daycares/${daycare.key}/groups`).once('value')
        .then( groups => {
          groups.forEach( group => {
            let listElement = `<li>${group.val().name}</li>`
            $('#groups').append(listElement)
          })
        })

      //show famillies
      database.ref(devRef+`/daycares/${daycare.key}/families`).once('value')
        .then( families => {
          families.forEach( family => {
            let listElement = `<li>${family.val().name}</li>`
            $('#families').append(listElement)
          })
        })
    })//end for each
  })//end then

}

/********************
New Group
*********************/

function newGroup() {
  //display newGroup UI
  cleanUpUI();
  let option =
  `<div class="row">
    <div class="col-2">Gruppenname</div><div class="col-10 col-lg-4 col-xl-4"><input type="text" class="form-control family" id="groupName" value=""></div>
    </div>
    <br>
    <button class="btn btn-success" role="button" id="done" onclick="newGroup.push()"><i class="fa fa-check"></i> Fertig</button>
    <button class="btn btn-danger" role="button" id="" onclick="showDaycare()"><i class="fa fa-times"></i> Abbrechen</button>`
  $('#pageContent').html(option)

  //function to push new Gruop to DB
  function push() {
    //disable send button to prevent another send click
    document.getElementById('done').disabled = true

    //get Group name
    let name = document.getElementById('groupName').value
    if (!name) {
      return alert('Bitte Namen eingeben')
    }

    //push to database
    database.ref(devRef+`/users/${firebase.auth().currentUser.uid}/daycares`).once('value')
    .then( snapshot => {
      snapshot.forEach( cS => {
        let daycareKey = cS.key
        let groupKey = database.ref(devRef+`/daycares/${daycareKey}/groups`).push({name}).key
        let uid = firebase.auth().currentUser.uid
        let message = {
          content : "Neuer Broadcast-Chat initialisiert. Nachrichten die hier abgeschickt werden, erhalten alle Gruppenmitglieder in ihrem persönlichen Chat",
          sender : uid,
          senderName : 'Admin',
          timestamp : firebase.database.ServerValue.TIMESTAMP
          }
        let chatObj = {
          broadcast : true,
          familyName : `<i class="fa fa-arrow-right" aria-hidden="true"></i> ${name}`,
          users : {
            [uid] : true },
          messages : {
            [database.ref().push().key] : message
          },
          lastMessage : message
        }
        database.ref(devRef+`/chats/${groupKey}`).set(chatObj)
        database.ref(devRef+`/users/${uid}/chats`).update({ [groupKey] : true })
      })//end for each
    })//end then
    showDaycare()
  }
  newGroup.push = push
}

function selectGroup(identifier,groupKey,groupName) {
  let groupElement = document.getElementById(identifier + 'Group')
  groupElement.value = groupName
  groupElement.setAttribute('groupkey',groupKey)
}//end selectGroup

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
    option = `
    <div class="row">
      <div class="col-2">E-Mail</div>
      <div class="col-10 col-lg-4 col-xl-4"><input type="text" class="${identifier} form-control family email" id="${identifier}EMail" value=""></div>
    </div>`
  } else {
    option =
    `<div class="row">
      <div class="col-2">Gruppe</div>
      <div class="col-10 col-lg-4 col-xl-4">
        <div class="input-group">
          <input type="text" class="${identifier} form-control family" id="${identifier}Group" value="" disabled>
          <div class="btn-group">
            <button type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Gruppe...
            </button>
            <div class="dropdown-menu dropdown-groups-${identifier}">
              <!--
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" href="#" onclick="">Neue Gruppe</button> -->
            </div>
          </div>
        </div>
      </div>
    </div>`

  }

  //prepare html
  var html =
  `<div class="row">
    <div class="col-2">Vorname</div>
    <div class="col-10 col-lg-4 col-xl-4"><input type="text" class="${identifier}   form-control family" id="${identifier}Firstname" value=""></div>
  </div>
  <div class="row">
    <div class="col-2">Nachname</div>
    <div class="col-10 col-lg-4 col-xl-4"><input type="text" class="${identifier}   form-control family" id="${identifier}Lastname" value=""></div>
  </div>
  ${option}
  <br>`

  $(template).append(html)

  if (target == 'kid') {
    database.ref(devRef+`/users/${firebase.auth().currentUser.uid}/daycares`).once('value')
    .then( snapshot => {
      snapshot.forEach( cS => {
        let daycareKey = cS.key
        database.ref(devRef+`/daycares/${daycareKey}/groups`).once("value")
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

function newFamily() {
  cleanUpUI()
  var html = `
  <h1>Neue Familie</h1>
  <div class="row">
  <div class="col-2">Familienname</div>
  <div class="col-10 col-lg-4 col-xl-4"><input type="text" class="form-control family" id="familyName" value=""></div>
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
  <button class="btn btn-danger" role="button" id="" onclick="showDaycare()"><i class="fa fa-times"></i> Abbrechen</button>
  `
  $('#pageContent').html(html)
  addTemplate('adult')
  addTemplate('kid')

}


function addChatToGroups(chatId,chatGroupIds){
  for (let index in chatGroupIds) {
    database.ref(devRef+`/chats/${(chatGroupIds[index])}/chats`).update({ [chatId] : true })
  }
}


function pushFamilyToFirebase(familyKey) {

  let chatKey = database.ref(devRef+'chats').push().key
  let groups = []
  //helper function to set adults
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
      let temporaryPassword = database.ref(devRef).push().key //use a key to set pw
      let newUser = taube.auth().createUserWithEmailAndPassword(email, temporaryPassword).then(function(newUser) {

        //change users displayName
        taube.auth().currentUser.updateProfile({ displayName : firstname }).then( _ =>  console.log('Username Changed'))

        //make db entry of adult properties
        database.ref(devRef+'/users/'+newUser.uid).set(adult)

        //make list for family/adults
        adults[newUser.uid] = true

        //send reset-password mail
        taube.auth().sendPasswordResetEmail(email).then(function() {
          // Email sent.
        }, function(error) {
          // An error happened.
        });

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
      // let adultKey = database.ref(devRef).push().key
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
      return database.ref(devRef+'/families/' + familyKey + '/adults/').set(adults)
    }).catch(error => { console.log(error.message)} )
  }

  //helper function to set kids
  function pushKids(familyKey) {
    //iterate over kidTemplates
    //gather in neat JSON
    let count = 0
    let target = 'kid'
    let kids = {}
    while (document.getElementById(target+count+'Lastname') !== null) {
      let newKey = database.ref(devRef).push().key
      let lastname = document.getElementById(target+count+'Lastname').value
      let firstname =  document.getElementById(target+count+'Firstname').value
      let group = document.getElementById(target+count+'Group').getAttribute('groupkey')
      kids[newKey] = {
        lastname,
        firstname,
        group
      }
      if(groups.find( function(e){ return e == this},group) == undefined){
        groups.push(group)
      }
      count += 1
    }
    return database.ref(devRef).child('/families/' + familyKey + '/kids').set(kids)
  }

  //initialize a new chat
  //users must be json containing { user1 : true, ... }
  function newChat(users, familyName) {
    //get new chat key
    // chatKey = database.ref(devRef+'chats').push().key
    // console.log(chatKey)

    //create participants JSON
    for (let key in users) {
      //add chat id to users/$uid/chats
      database.ref(devRef+`/users/${key}/chats`).update({ [chatKey] : true })
    }

    //initialize chat with paticipants
    database.ref(devRef+`/chats/${chatKey}/users`).set(users)

    //create chat name as familyName
    //as for now: just take the familyname from DOM Element
    database.ref(devRef+`/chats/${chatKey}/`).update({ familyName })

    //initialize welcome message
    var userNames = '<ul>'
    var proms = []
    for (let userId in users) {
      let prom = database.ref(devRef+`/users/${userId}/`).once('value')
      .then( snapshot => {
        let name = snapshot.val().fullname ? snapshot.val().fullname : snapshot.val().firstname
        userNames += `<li>${name}</li>`
      })
      proms.push(prom)
    }
    Promise.all(proms).then( proms => {
      userNames += '</ul>'
      let message = {
        content : `👋 Willkommen im Chat! Mitglieder sind ${userNames}`,
        sender : firebase.auth().currentUser.uid,
        senderName : "Admin",
        timestamp : firebase.database.ServerValue.TIMESTAMP
        // receiver :
        //   receiverIDs
        //timestamp
      }
      database.ref(devRef+`/chats/${chatKey}/messages`).push(message)
      message['content'] = 'Willkommen im Chat!';
      database.ref(devRef+`/chats/${chatKey}/lastMessage`).set(message)
    })
  }



  //check wether inputs are filled
  function checkFields() {
    let inputFields = document.getElementsByClassName('family')
    for (let i=0;i<inputFields.length;i++) {
      if(inputFields[i].value == false || '' || undefined || null){
        alert('Bitte alle Felder ausfüllen')
        return false
      }
    }

    //check wether email inputs are good formated
    function checkMail(email) {
      var regexEmailFormat = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
      return regexEmailFormat.test(email)
    }
    let emails = document.getElementsByClassName('email')
    for (let i=0;i<emails.length;i++){
      let email = emails[i].value
      if(!checkMail(email)) {
        alert(`E-Mail "${email}" ist falsch formatiert.`)
        return false
      }
    }
    return true
  }
  if(!checkFields()) { return false }


  //first, disable button to prevent multiple pushes
  document.getElementById('done').disabled = true

  //if no key is provided, generate new family key
  if (familyKey === undefined) {
    var familyKey = database.ref(devRef).child('families').push().key
  }
  var familyName = document.getElementById('familyName').value
  //write familyname to family entry
  var family = {
    name : familyName
    // members
  }

  //push family base to firebase
  //to daycare ref
  database.ref(devRef+`/users/${firebase.auth().currentUser.uid}/daycares`).once('value')
  .then( daycares => {
    daycares.forEach( daycare => {
      //show famillies
      database.ref(devRef+`/daycares/${daycare.key}/families/${familyKey}`).set(family)
    })//end for each
  })//end then
  let p1 = database.ref(devRef).child('/families/'+familyKey).set(family)
  let p2 = pushAdults(familyKey, familyName)
  let p3 = pushKids(familyKey)

  //wait for all to be sovled
  Promise.all([p1, p2, p3]).then(function(){
    console.log('Chatkey:',chatKey,'Groups:',groups)
    addChatToGroups(chatKey,groups)
    showDaycare()
  }).catch(function(e){
    console.log(e)
  })

}


/*************************
APP FUNCTIONS
************************/

//Clean Up Page Content
if (typeof cleanUpUI != 'function') {

  function cleanUpUI() {
    $('#pageContent').html('')
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

        //load home view with family DB
        cleanUpUI()

      } else {
        // User is signed out.
        document.getElementById('login-screen').style.display = ''; //Show login screen if user is signed-Out
        document.getElementById('main-view').style.display = 'none';

      } //end if
    }); //end of mehtod

    //dev
    $('#email').val('e.scherlies@me.com');
    $('#password').val('qwer1234');

    //Add Event Listenesrs
    document.getElementById('signOutButton').addEventListener('click',signOut,false);
    document.getElementById('signInButton').addEventListener('click',signIn,false);
    // document.getElementById('newFamily').addEventListener('click',newFamily,false);
    // document.getElementById('newGroup').addEventListener('click',newGroup,false);
  }

  window.onload = function() {
    initApp();
    console.log('Init')
  };
}
