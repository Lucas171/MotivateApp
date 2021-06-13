function showSave() {
  let saveButtonDiv = document.getElementById("saveButtonDiv");

  if (saveButtonDiv.classList.contains("d-none")) {
    saveButtonDiv.classList.remove("d-none");
  }
}

let fName;
let lName;

if (document.getElementById("firstName") != null) {
  fName = document.getElementById("firstName").value;
  lName = document.getElementById("lastName").value;
}

function hideSave() {
  let saveButtonDiv = document.getElementById("saveButtonDiv");

  if (fName == document.getElementById("firstName").value) {
    if (lName == document.getElementById("lastName").value) {
      saveButtonDiv.classList.add("d-none");
    }
  } else if (lName == document.getElementById("lastName").value) {
    if (fName == document.getElementById("firstName").value) {
      saveButtonDiv.classList.add("d-none");
    }
  }
}

function showPrivacySettingsSave() {
  let saveButtonDiv2 = document.getElementById("saveButtonDiv2");

  if (saveButtonDiv2.classList.contains("d-none")) {
    saveButtonDiv2.classList.remove("d-none");
  }
}

let privacySetting;

if (document.getElementById("privacySetting") != null) {
  privacySetting = document.getElementById("privacySetting").value;
  console.log(privacySetting);
}

function hidePrivacySettingsSave() {
  let saveButtonDiv2 = document.getElementById("saveButtonDiv2");

  if (privacySetting == document.getElementById("privacySetting").value) {
    saveButtonDiv2.classList.add("d-none");
  }
}
