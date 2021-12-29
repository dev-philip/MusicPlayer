import $ from "jquery";
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './css/style.css';
const axios = require('axios');

//baseurl
// let currentHostname = window.location.hostname;
// const base_url = 'http://127.0.0.1:8000'; 

let base_url = 'https://www.devphilip.com/projects/inventory/public';

//Define variables
let audio, addsong, sidebarmenuopen, sidebarmenuclose, nextbtn, prevbtn, playbtn, title, poster, artists, keys, mutebtn, seekslider, volumeslider, seeking = false,
    seekto, curtimetext,
    durtimetext, playlist_status, playlist, ext, agent, playlist_artist, repeat, randomSong, playlist_index;

//Initialization of Array of Music, Title, Poster Image, Artists

let MUSIC_DATA = [];

playlist = [];
title = [];
artists = [];
poster = [];
keys = [];
let ul = document.querySelector(".list-group"); //create side nav ul tag to display nav content

function loadPlayer() {
    playlist = [];
    title = [];
    artists = [];
    poster = [];
    keys = []; //empty arrays

    let addmusicbtn = document.querySelector("#addsong");
    addmusicbtn.innerHTML = "Add Song";

    for (let i = 0; i < MUSIC_DATA.length; i++) {

        playlist.push(MUSIC_DATA[i].playlist);
        title.push(MUSIC_DATA[i].title);
        artists.push(MUSIC_DATA[i].artist);
        poster.push(MUSIC_DATA[i].poster);
        keys.push(MUSIC_DATA[i].ID);

        let li = document.createElement('li');
        let editbtn = document.createElement('i');
        let deletebtn = document.createElement('i');
        let playsidebtn = document.createElement('i');

        li.innerHTML = title[i]; // assigning song titles to li using array value.

        setAttributes(li, {
            'class': 'list-group-item musiclistholder animate__animated animate__fadeInUp', // remove the bullets and add bootstrap design.
            'key': keys[i] // add key to list.
        });

        setAttributes(editbtn, {
            'class': 'fa fa-pencil editsonglist',
            'title': 'Edit Song',
            'key': keys[i], // add key to edit btn.
            'position': i
        });


        setAttributes(deletebtn, {
            'class': 'fa fa-trash deletesonglist',
            'title': 'Delete Song',
            'key': keys[i] // add key to delete btn.
        });

        setAttributes(playsidebtn, {
            'class': 'fa fa-play-circle playesonglist',
            'title': 'Play Song',
            'key': i // add key to delete btn.
        });

        li.appendChild(playsidebtn); // Play Button.
        li.appendChild(editbtn); // Edit Button.
        li.appendChild(deletebtn); // Delete Button.
        ul.appendChild(li); // append li to ul.

    }


    activateSidebarBtn();

    //Set object references
    // let musictitlelist = document.querySelector(".list-group-item");
    sidebarmenuopen = document.getElementById("sidebarmenu"); //menu open
    sidebarmenuclose = document.getElementById("closenav"); //menu close
    addsong = document.getElementById("addsong"); //add song modal
    playbtn = document.getElementById("playpausebtn");
    nextbtn = document.getElementById("nextbtn");
    prevbtn = document.getElementById("prevbtn");
    mutebtn = document.getElementById("mutebtn");
    seekslider = document.getElementById("seekslider");
    volumeslider = document.getElementById("volumeslider");
    curtimetext = document.getElementById("curtimetext");
    durtimetext = document.getElementById("durtimeText");
    playlist_status = document.getElementById("playlist_status");
    playlist_artist = document.getElementById("playlist_artist");
    repeat = document.getElementById("repeat");
    randomSong = document.getElementById("random");

    playlist_index = 0;

    //Audio Object
    audio = new Audio();
    audio.src = MUSIC_DATA[0].songurl; //music/musicname.mp3

    audio.loop = false;


    //First Song Title and Artist
    playlist_status.innerHTML = title[playlist_index];
    playlist_artist.innerHTML = artists[playlist_index];

    //Add Event Handling
    sidebarmenuopen.addEventListener("click", openNav);
    sidebarmenuclose.addEventListener("click", closeNav);
    addsong.addEventListener("click", addSongModal);
    playbtn.addEventListener("click", playPause);
    nextbtn.addEventListener("click", nextSong);
    prevbtn.addEventListener("click", prevSong);
    mutebtn.addEventListener("click", mute);
    seekslider.addEventListener("mousedown", function(event) {
        seeking = true;
        seek(event);
    });
    seekslider.addEventListener("mousemove", function(event) {
        seek(event);
    });
    seekslider.addEventListener("mouseup", function() {
        seeking = false;
    });
    volumeslider.addEventListener("mousemove", setvolume);
    audio.addEventListener("timeupdate", function() {
        seektimeupdate();
    });
    audio.addEventListener("ended", function() {
        switchTrack();
    });
    repeat.addEventListener("click", loop);
    randomSong.addEventListener("click", random);

} //end

//sideplaybuttonactivation
function activateSidebarBtn() {
    $(".playesonglist").click(function() {
        let songSrckey = $(this).attr("key");
        audio.pause();
        $("#playpausebtn img").attr("src", "images/pause-red.png");

        //music background
        $("#bgImage").attr("src", MUSIC_DATA[songSrckey].poster);
        $("#image").attr("src", MUSIC_DATA[songSrckey].poster);

        //Title and Artist
        playlist_status.innerHTML = MUSIC_DATA[songSrckey].title;
        playlist_artist.innerHTML = MUSIC_DATA[songSrckey].artist;

        audio.src = MUSIC_DATA[songSrckey].songurl;
        audio.play();

    });

    $(".editsonglist").click(function() {
        let songId = $(this).attr("key");
        let titlePosition = $(this).attr("position");
        const keyid = document.querySelector('#songkeyid');
        keyid.value = songId;
        const modalname = document.querySelector('.myowntitle');
        modalname.innerHTML = 'Edit Song ' + title[titlePosition];
        $('#editsongtitle').val(title[titlePosition])
        $('#editartistname').val(artists[titlePosition])
        $('.editbgimage').attr("src", poster[titlePosition]);

        editSongModal();
    });

    $(".deletesonglist").click(function() {
        let songId = $(this).attr("key");

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showClass: {
                popup: 'animate__animated animate__fadeIn'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOut'
            },
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $(this).html("<i style='padding-left:2px; font-size: 11px;' class='fa fa-spinner fa-spin'></i>");

                axios.delete(base_url+'/api/deletesong/' + songId)
                    .then((response) => {
                        // allSongData();
                        console.log('Success');
                        console.log(response);
                        if (response.data.status === 'false') { //error
                            Swal.fire({
                                icon: 'error',
                                html: '<strong>' + response.data.message + '</strong>',
                                showConfirmButton: true,
                                allowOutsideClick: false,
                                confirmButtonText: '<i class="fa fa-thumbs-up"></i> Great!',
                            })
                            $(this).html("");

                        } else { //success
                            Swal.fire({
                                position: 'top-end',
                                icon: 'success',
                                html: '<h5>Hey, Song Deleted 🙂</h5>',
                                showConfirmButton: false,
                                timer: 1500
                            })

                            reloadPlayer();

                            $(this).html("");

                        }

                    })
                    .catch(() => {
                        $(this).html("");
                        console.log('error');
                    })

            }
        })
    });
}

//Functions
function fetchMusicDetails() {
    //Poster Image, Pause/Play Image
    $("#playpausebtn img").attr("src", "images/pause-red.png");
    $("#bgImage").attr("src", MUSIC_DATA[playlist_index].poster);
    $("#image").attr("src", MUSIC_DATA[playlist_index].poster);

    //Title and Artist
    playlist_status.innerHTML = MUSIC_DATA[playlist_index].title;
    playlist_artist.innerHTML = MUSIC_DATA[playlist_index].artist;

    //Audio
    audio.src = MUSIC_DATA[playlist_index].songurl;
    audio.play();
}



function playPause() {
    if (audio.paused) {
        audio.play();
        $("#playpausebtn img").attr("src", "images/pause-red.png");
    } else {
        audio.pause();
        $("#playpausebtn img").attr("src", "images/play-red.png");
    }
}

function nextSong() {
    playlist_index++;
    if (playlist_index > playlist.length - 1) {
        playlist_index = 0;
    }
    fetchMusicDetails();
}

function prevSong() {
    playlist_index--;
    if (playlist_index < 0) {
        playlist_index = playlist.length - 1;
    }
    fetchMusicDetails();
}

function mute() {
    if (audio.muted) {
        audio.muted = false;
        $("#mutebtn img").attr("src", "images/speaker.png");
    } else {
        audio.muted = true;
        $("#mutebtn img").attr("src", "images/mute.png");
    }
}



function seek(event) {
    if (audio.duration == 0) {
        null
    } else {
        if (seeking) {
            seekslider.value = event.clientX - seekslider.offsetLeft;
            seekto = audio.duration * (seekslider.value / 100);
            audio.currentTime = seekto;
        }
    }

}

function setvolume() {
    audio.volume = volumeslider.value / 100;
}



function seektimeupdate() {
    if (audio.duration) {
        let nt = audio.currentTime * (100 / audio.duration);
        seekslider.value = nt;
        var curmins = Math.floor(audio.currentTime / 60);
        var cursecs = Math.floor(audio.currentTime - curmins * 60);
        var durmins = Math.floor(audio.duration / 60);
        var dursecs = Math.floor(audio.duration - durmins * 60);
        if (cursecs < 10) { cursecs = "0" + cursecs }
        if (dursecs < 10) { dursecs = "0" + dursecs }
        if (curmins < 10) { curmins = "0" + curmins }
        if (dursecs < 10) { dursecs = "0" + dursecs }

        curtimetext.innerHTML = curmins + ":" + cursecs;
        durtimetext.innerHTML = durmins + ":" + dursecs;
    } else {
        curtimetext.innerHTML = "00" + ":" + "00";
        durtimetext.innerHTML = "00" + ":" + "00";
    }
}

function switchTrack() {
    if (playlist_index == (playlist.length - 1)) {
        playlist_index = 0;
    } else {
        playlist_index++;
    }
    fetchMusicDetails();
}

function loop() {
    if (audio.loop) {
        audio.loop = false;
        $("#repeat img").attr("src", "images/rep.png");
    } else {
        audio.loop = true;
        $("#repeat img").attr("src", "images/rep1.png");
    }
}

function getRandomNumber(min, max) {
    let step1 = max - min + 1;
    let step2 = Math.random() * step1;
    let result = Math.floor(step2) + min;
    return result;
}

function random() {
    let randomIndex = getRandomNumber(0, playlist.length - 1);
    playlist_index = randomIndex;
    fetchMusicDetails();
}
//return
function openNav() { //open side navigation bar
    document.getElementById("mySidenav").style.width = "250px";
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";

    // console.log(MUSIC_DATA);
}

function closeNav() { //close side bar navigation bar
    document.getElementById("mySidenav").style.width = "0";
    document.body.style.backgroundColor = "white";
    $(".myserachform").fadeOut();
}


function addSongModal() { //open add song modal
    closeNav();
    $("#addsongmodal").fadeIn();
}

function editSongModal() { //open edit song modal
    closeNav();
    $("#editsongmodal").fadeIn();
}

function closeSongModal() { //close add song modal
    $("#addsongmodal").fadeOut();
    openNav();
}

function closeEditModal() { //close add song modal
    $("#editsongmodal").fadeOut();
    openNav();
}

$(".closeeditmodalx,.closeeditmodal").click(function() { //close the modal withbthe x button or close btn
    closeEditModal();
});

$(".closeaddmodalx,.closeaddmodal").click(function() { //close the modal withbthe x button or close btn
    closeSongModal();
});


//get all song from server
function allSongData() {
    axios.get(base_url + '/api/music/getsongdata/')
        .then(({ data }) => {
            $("#bgImage").attr("src", data[0].poster);
            $("#image").attr("src", data[0].poster);
            MUSIC_DATA = data;
            loadPlayer();
        })
        .catch((error) => {
            console.log('Could not receive data from database');
            console.log(error);
        })
}

allSongData();

function reloadPlayer() {
    let musictitlelist = document.querySelector(".musiclistcontain");
    musictitlelist.innerHTML = "";
    let addmusicbtn = document.querySelector("#addsong");
    addmusicbtn.innerHTML = "<i style='font-size: 11px;' class='fa fa-spinner fa-spin'></i>";
    audio.pause();
    $("#playpausebtn img").attr("src", "images/play-red.png");
    allSongData();
}

// Add song form submission to server
$("#formdatasubmit").on('submit', (function(e) {
    e.preventDefault();
    $('#savesong').val('Processing ...').prop('disabled', true);

    const songtitle = document.querySelector('#songtitle');
    const artistname = document.querySelector('#artistname');
    const musicfile = document.querySelector('#musicfile');
    const musicimage = document.querySelector('#musicimage');

    // Create a new FormData object
    const fd = new FormData();
    fd.append('title', songtitle.value);
    fd.append('artistname', artistname.value);
    fd.append('musicfile', musicfile.files[0]);
    fd.append('musicimage', musicimage.files[0]);


    axios.post(base_url + '/api/save/music', fd)
        .then(() => {
            closeSongModal();
            openNav();
            console.log('successful');
            reloadPlayer();

            $('#savesong').val('Save Song').prop('disabled', false);
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                html: '<h5>Hey, Song added to playlist 🙂</h5>',
                showConfirmButton: false,
                timer: 3500
            })

        })
        .catch((error) => {
            console.log('encountered error');
            console.log(error);
            $('#savesong').val('Save Song').prop('disabled', false);
            $('.errortextmssg').html(error.response.data.errors.title[0]);
            setTimeout(function() {
                $('.errortextmssg').html('');
            }, 2700);
        })


}));

// Edit song form submission to server
$("#editformdatasubmit").on('submit', (function(e) {
    e.preventDefault();
    $('#editsong').val('Processing ...').prop('disabled', true);

    const songtitle = document.querySelector('#editsongtitle');
    const artistname = document.querySelector('#editartistname');
    const musicimage = document.querySelector('#editmusicimage');
    const keyid = document.querySelector('#songkeyid');
    const id = keyid.value;

    // Create a new FormData object
    const fd = new FormData();
    fd.append('title', songtitle.value);
    fd.append('artistname', artistname.value);
    fd.append('musicimage', musicimage.files[0]);


    axios.post(base_url + '/api/editsong/' + id, fd)
        .then(() => {
            closeEditModal();
            openNav();
            console.log('successful');
            reloadPlayer();

            $('#editsong').val('Edit Song').prop('disabled', false);
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                html: '<h5>Hey, Song details updated 🙂</h5>',
                showConfirmButton: false,
                timer: 3500
            })

        })
        .catch((error) => {
            console.log('encountered error');
            console.log(error);
            $('#editsong').val('Edit Song').prop('disabled', false);
            $('.errortextmssgedit').html(error.response.data.errors.title[0]);
            setTimeout(function() {
                $('.errortextmssgedit').html('');
            }, 2700);
        })


}));

//search a music
$("#searchicon").click(function() {
    openNav();
    setTimeout(function() {
        $(".myserachform").show();
    }, 400);


});

//bootstrap show name of file input
$('#musicimage, #musicfile').on('change', function(e) {
    //get the file name
    var fileName = e.target.files[0].name;
    //replace the "Choose a file" label
    $(this).next('.custom-file-label').html(fileName);
})

$('#editmusicimage').on('change', function(e) {
    //get the file name
    let file = e.target.files[0];
    var fileName = e.target.files[0].name;

    let reader = new FileReader();
    reader.onload = event => {
        $(".editbgimage").attr("src", event.target.result);
    }

    reader.readAsDataURL(file);


    //replace the "Choose a file" label
    $(this).next('.custom-file-label').html(fileName);
})

//Helper function to add attributes
function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

//searching
const searchElement = document.getElementById('searchkeyword');
searchElement.addEventListener('keyup', searchSong);

function searchSong(e) {

    let searchDataIndex = filterItems(title, e.target.value);
    let musictitlelist = document.querySelector(".musiclistcontain");
    musictitlelist.innerHTML = "";
    populateSearch(searchDataIndex);
}



function filterItems(arr, query) { //Get index of filtered array
    let searchDataSetIndex = [];

    arr.forEach((titlearr, index) => {
        if (titlearr.toLowerCase().match(query.toLowerCase())) {
            searchDataSetIndex.push(index);
        }
    })
    return searchDataSetIndex;
}


function populateSearch(gotSearchData) { //received array of indexes
    // console.log(gotSearchData);


    for (let i = 0; i < gotSearchData.length; i++) {

        let li = document.createElement('li');
        let editbtn = document.createElement('i');
        let deletebtn = document.createElement('i');
        let playsidebtn = document.createElement('i');

        li.innerHTML = title[gotSearchData[i]]; // assigning text to li using array value.

        setAttributes(li, {
            'class': 'list-group-item musiclistholder animate__animated animate__fadeInUp', // remove the bullets and add bootstrap design.
            'key': keys[gotSearchData[i]] // add key to list.
        });

        setAttributes(editbtn, {
            'class': 'fa fa-pencil editsonglist',
            'title': 'Edit Song',
            'key': keys[gotSearchData[i]], // add key to edit btn.
            'position': gotSearchData[i]
        });


        setAttributes(deletebtn, {
            'class': 'fa fa-trash deletesonglist',
            'title': 'Delete Song',
            'key': keys[gotSearchData[i]] // add key to delete btn.
        });

        setAttributes(playsidebtn, {
            'class': 'fa fa-play-circle playesonglist',
            'title': 'Play Song',
            'key': gotSearchData[i] // add key to delete btn.
        });

        li.appendChild(playsidebtn); // Play Button.
        li.appendChild(editbtn); // Edit Button.
        li.appendChild(deletebtn); // Delete Button.
        ul.appendChild(li); // append li to ul.

    }


    activateSidebarBtn();
}