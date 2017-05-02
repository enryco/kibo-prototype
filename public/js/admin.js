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
  var email = ''
  if (target != 'kid') {
    email = `<div class="col-2">E-Mail</div><div class="col-10"><input type="text" class="${identifier} form-control" id="${identifier}EMail" value="testUser${count}@enricoscherlies.de"></div>`
  } else {
    email = `<div class="col-2">Gruppe</div><div class="col-6"><input type="text" class="${identifier} form-control" id="${identifier}Group" value="" disabled></div>
    <div class="btn-group col-4">
      <button type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        Gruppe...
     </button>
     <div class="dropdown-menu">
       <button class="dropdown-item" href="#" onclick="(function(){ document.getElementById('${identifier}Group').value = 'Gruppe 1'})()">Gruppe 1</button>
       <button class="dropdown-item" href="#">Gruppe 2</button>
       <button class="dropdown-item" href="#">Gruppe 3</button>
       <div class="dropdown-divider"></div>
       <button class="dropdown-item" href="#">Neue Gruppe</button>
     </div>
    </div>`
  }

  //prepare html
  var html = `<div class="row">
    <div class="col-2">Vorname</div><div class="col-10"><input type="text" class="${identifier}   form-control" id="${identifier}Surname" value="${identifier}Surname"></div>
    <div class="col-2">Nachname</div><div class="col-10"><input type="text" class="${identifier}   form-control" id="${identifier}Name" value="${identifier}Name"></div>
    ${email}
    </div>
    <br>`

  $(template).append(html)
  return html
}

function newFamily() {
  var html = `
    <h1>Neue Familie</h1>
    <div class="row">
      <div class="col-2">Familienname</div>
      <div class="col-10"><input type="text" class="form-control" id="familyName" value=""></div>
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

function pushAdults(familyKey) {
  // FUNCTION to set adult entries to db
  var count = 0
  var target = 'adult'
  var adults = {}
  var callCenter = [] //use to gather all promisses from while loop

  //iterate over adultTemplates
  //gather in neat JSON
  while (document.getElementById(target+count+'Surname') !== null) {
    let adultKey = firebase.database().ref().push().key
    let surname = document.getElementById(target+count+'Surname').value
    let name =  document.getElementById(target+count+'Name').value
    let email = document.getElementById(target+count+'EMail').value
    var adult = {
      surname,
      name,
      fullname : `${surname} ${name}`,
      email,
      family : { [familyKey] : true }
    }

    //create actual user w/ random pw
    //using second firebase app for signin up new user
    let temporaryPassword = firebase.database().ref().push().key //use a key to set pw
    let newUser = taube.auth().createUserWithEmailAndPassword(email, temporaryPassword).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code
      var errorMessage = error.message
      alert(errorMessage)
      // ...
    });

    //append newUser (Promise) to callCenter
    callCenter.push(newUser)

    //wait for newUser promis
    Promise.all([newUser]).then(function(proms){
      firebase.database().ref('/users/'+proms[0].uid).set(adult)
      adults[proms[0].uid] = true //make list for family/adults
      //delete user to allow smooth developement
      taube.auth().currentUser.delete().then(function() {  console.log('User deleted')     }, function(error) { /* An error happened. */ })

    }).catch(function(error){
      alert(error.message)
    })

    count += 1
  }

  //wait for everyone to have us called back
  Promise.all(callCenter).then(function(){
    return firebase.database().ref('/families/' + familyKey + '/adults/').set(adults)
  })
}

function pushKids(familyKey) {

  //iterate over kidTemplates
  //gather in neat JSON
  var count = 0
  var target = 'kid'
  var kids = {}
  while (document.getElementById(target+count+'Surname') !== null) {
    let newKey = firebase.database().ref().push().key
    let surname = document.getElementById(target+count+'Surname').value
    let name =  document.getElementById(target+count+'Name').value
    let group = document.getElementById(target+count+'Group').value
    kids[newKey] = {
      surname,
      name,
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
    id : familyKey,
    name : familyName
    // members
  }

  //push family base to firebase
  var p1 = firebase.database().ref().child('families/'+familyKey).set(family)
  var p2 = pushAdults(familyKey)
  var p3 = pushKids(familyKey)

  //wait for all to be sovled
  Promise.all([p1, p2, p3]).then(function(){
    cleanUpUI()
    showFamilies()
  }).catch(function(e){
    console.log(e)
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

  $('#email').val('e.scherlies@me.com');


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
