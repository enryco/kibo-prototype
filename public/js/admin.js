//shortcuts
//var pageContent = document.getElementById('pageContent');
var database = firebase.database();

/********************
  New Family
  *********************/

function addTemplate(target) {

  //set target Template to render to
  var template = '#' + target + 'Templates'

  //Check if there is already an element and if so increase count by one
  var count = 0 //Start Counting Target Elements from Zerooooooo
  while (document.getElementsByClassName(target+count).length) {
    count += 1
  }
  var identifier = target + count //merge target and count to one variable with syntax 'target0', 'target1', ..

  //if target = child -> no email
  var email = ''
  if (target != 'kid') {
    email = '<div class="col-2">E-Mail</div><div class="col-10"><input type="text" class="' + identifier + ' form-control" id="' + identifier + 'EMail'+ '" value=""></div>'
  } else {
    email = '<div class="col-2">Gruppe</div><div class="col-6"><input type="text" class="' + identifier + ' form-control" id="' + identifier + 'Group'+ '" value="" disabled></div>'
    + '<div class="btn-group col-4">'
      + '<button type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'
        + 'Gruppe...'
    +  '</button>'
    +  '<div class="dropdown-menu">'
          //Groups
    +    '<button class="dropdown-item" href="#" onclick="(function(){ document.getElementById(\'' + identifier + 'Group\').value = \'Gruppe 1\'})()">Gruppe 1</button>'
    +    '<button class="dropdown-item" href="#">Gruppe 2</button>'
    +    '<button class="dropdown-item" href="#">Gruppe 3</button>'
    +    '<div class="dropdown-divider"></div>'
    +    '<button class="dropdown-item" href="#">+ Neue Gruppe</button>'
    +  '</div>'
    + '</div>';
  }

  //prepare html
  var html = '<div class="row">' +
    '<div class="col-2">Vorname</div><div class="col-10"><input type="text" class="' + identifier + ' form-control" id="' + identifier + 'Surname' + '" value=""></div>' +
    '<div class="col-2">Nachname</div><div class="col-10"><input type="text" class="' + identifier + ' form-control" id="' + identifier+ 'Name'+ '" value=""></div>' +
    email +
    '</div>' +
    '<br>';

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
    <button class="btn btn-success" role="button" id=""><i class="fa fa-check"></i> Fertig</button>
    `
  $('#newFamilyTarget').html(html)
  addTemplate('adult')
  addTemplate('kid')
  document.getElementById('pageContent').style.display = 'none'

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
  document.getElementById('new-post').style.display = 'none';
  document.getElementById('navbar-chat').style.display = 'none';
  document.getElementById('navbar-view').style.display = '';
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

      //load home view with kitaUpdates

    } else {
      // User is signed out.
      document.getElementById('login-screen').style.display = ''; //Show login screen if user is signed-Out
      document.getElementById('main-view').style.display = 'none';
      document.getElementById('navbar-view').style.display = 'none';
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
