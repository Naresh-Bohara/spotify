let currentSong = new Audio();
let songs;
let currentFolder;
let duration = "00"; // Initialize duration to NaN
let currentSongIndex = 0;

function MinutesSeconds(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60); 
    
    // Pad with leading zeros if necessary
    let formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    let formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    return formattedMinutes + ' : ' + formattedSeconds;
}

async function getSongs(folder) {
    try {
        currentFolder = folder;
        let response = await fetch(`/${folder}/`);
        if (!response.ok) {
            throw new Error(`Failed to fetch songs (${response.status} ${response.statusText})`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");

        let songs = [];

        for (let i = 0; i < as.length; i++) {
            const element = as[i];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currentFolder}/${track}`;
    if (!pause) {
        if (currentSong.paused) {
            currentSong.play().catch(error => {
                console.error('Failed to play the audio:', error);
            });
            play.src = "pause.svg ";  
        } else {
            currentSong.pause();
            play.src = "play.svg";
            updateTimeDisplay(duration); // Update time display with stored duration when pausing
        }
    } else {
        currentSong.pause();
        play.src = "play.svg";
        updateTimeDisplay(duration); 
    }
    let decodedTrack = decodeURIComponent(track); 
    decodedTrack = `${decodedTrack.replace(/_/g, " ").replace(/\.mp3$/, "")}.mp3`; // Format the track name
    document.querySelector(".songinfo").innerHTML = decodedTrack;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

function updateTimeDisplay(duration) {
    if (!isNaN(duration)) {
        document.querySelector(".songtime").innerHTML = `${MinutesSeconds(currentSong.currentTime)} / ${MinutesSeconds(duration)}`;
    } else {
        document.querySelector(".songtime").innerHTML = `00:00 / NaN:NaN`;
    }
}

async function main() {
    function loadPlaylist(folder) {
        return async () => {
            songs = await getSongs(folder);
            currentSongIndex = 0; 
            playMusic(songs[currentSongIndex], true); 
            
            // Clear the current playlist
            document.querySelector(".songList").getElementsByTagName("ul")[0].innerHTML = "";
            // Show all the songs in the new playlist
            let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
            for (const song of songs) {
                let decodedSongName = decodeURIComponent(song);
                let cleanedSongName = decodedSongName.replace(/_/g, " ").replace(/\.mp3$/, "");
                songUL.innerHTML += `<li>
                    <img class="invert" src="music.svg" alt="">
                    <div class="info">
                        <div>${cleanedSongName}</div>
                        <div>Naresh Bohara</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="play.svg" alt="">
                    </div>
                </li>`;
            }

            // Attach an event listener to each song 
            let songListItems = document.querySelectorAll(".songList li");
            songListItems.forEach((listItem, index) => {
                listItem.addEventListener("click", () => {
                    currentSongIndex = index; // Update the current song index
                    let songNameElement = listItem.querySelector(".info div:first-child");
                    if (songNameElement) {
                        let songName = songNameElement.textContent.trim().replace(/ /g, "_") + ".mp3";
                        playMusic(songName);
                        closeNavigation(); // Close navigation menu
                    } else {
                        console.error("Song name element not found.");
                    }
                });
            });
        };
    }

    // Get all card elements
    let cards = document.querySelectorAll(".card");

    // Attach event listener to each card
    cards.forEach(card => {
        card.addEventListener("click", () => {
            // Get the folder attribute value of the clicked card
            let folder = card.getAttribute("data-folder");
            // Load playlist corresponding to the clicked card
            loadPlaylist(`songs/${folder}`)();
        });
    });

    // Attach an event listener to previous, play and next.
    play.addEventListener("click", togglePlay);
    
    // Event listener for spacebar
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
            togglePlay();
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", ()=>{
        updateTimeDisplay(duration);
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration)*100 + "%" ;
    });

    // Add an event Listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", (e)=>{
        let percent = (e.offsetX / e.target.getBoundingClientRect().width)*100;
       document.querySelector(".circle").style.left = percent + "%";
       currentSong.currentTime = ((currentSong.duration)* percent)/100;
    });

    // Store the duration when the audio starts playing
    currentSong.addEventListener("playing", () => {
        duration = currentSong.duration;
    });

    // Add an eventlistener for hamburger
    document.querySelector(".hamburger").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "0";
    });

    // Add an eventlistener for close button
    document.querySelector(".close").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener to previous button
    previous.addEventListener("click", () => {
        if (currentSongIndex > 0) {
            currentSongIndex--;
        } else {
            currentSongIndex = songs.length - 1;
        }
        playMusic(songs[currentSongIndex]);
    });

    // Add an event listener to next button
    next.addEventListener("click", () => {
        if (currentSongIndex < songs.length - 1) {
            currentSongIndex++;
        } else {
            currentSongIndex = 0;
        }
        playMusic(songs[currentSongIndex]);
    });

    // Add event listener to mute/unmute button
    document.querySelector(".volume > img").addEventListener("click", () => {
        if (currentSong.volume === 0) {
            currentSong.volume = 0.1;
        } else {
            currentSong.volume = 0;
        }
        updateVolumeIcon(); // Update volume icon based on the current volume level
    });

    // Add an event listener to the volume range input
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("input", (e) => {
        let volume = parseInt(e.target.value);
        currentSong.volume = volume / 100;
        updateVolumeIcon(); // Update volume icon based on the current volume level
    });

    // Load the default playlist "nep" on initial load
    loadPlaylist('songs/nep')(); // Load the "nep" playlist
}

function togglePlay() {
    if(currentSong.paused){
        currentSong.play();
        play.src = "pause.svg";
    } else {
        currentSong.pause();
        play.src = "play.svg";
    }
}

function closeNavigation() {
    document.querySelector(".left").style.left = "-120%";
}

function updateVolumeIcon() {
    let volumeIcon = document.querySelector(".volume > img");
    if (currentSong.volume === 0) {
        volumeIcon.src = "mute.svg";
    } else {
        volumeIcon.src = "volume.svg";
    }
}

// Call the main function to initialize the application
main();
