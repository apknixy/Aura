// script.js

// --- Global UI Elements ---
const loginScreen = document.getElementById('login-screen');
const mainAppScreen = document.getElementById('main-app-screen');
const homeSection = document.getElementById('home-section');
const shortsSection = document.getElementById('shorts-section');
const uploadSection = document.getElementById('upload-section');
const profileSection = document.getElementById('profile-section');
const videoPlaybackScreen = document.getElementById('video-playback-screen');
const shortsPlaybackScreen = document.getElementById('shorts-playback-screen');

// Navigation Buttons
const homeNavBtn = document.getElementById('home-nav-btn');
const shortsNavBtn = document.getElementById('shorts-nav-btn');
const uploadNavBtn = document.getElementById('upload-nav-btn');
const profileNavBtn = document.getElementById('profile-nav-btn');

// Login Elements
const usernameInput = document.getElementById('username-input');
const checkUsernameBtn = document.getElementById('check-username-btn');
const usernameStatus = document.getElementById('username-status');
const emojiGrid = document.getElementById('emoji-grid');
const selectedEmojiInput = document.getElementById('selected-emoji');
const createChannelBtn = document.getElementById('create-channel-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const facebookLoginBtn = document.getElementById('facebook-login-btn'); // You'll need to configure Facebook login with Firebase

// Upload Elements
const uploadShortBtn = document.getElementById('upload-short-btn');
const uploadVideoBtn = document.getElementById('upload-video-btn');
const shortUploadForm = document.getElementById('short-upload-form');
const videoUploadForm = document.getElementById('video-upload-form');
const submitShortBtn = document.getElementById('submit-short-btn');
const submitVideoBtn = document.getElementById('submit-video-btn');

// Video Playback Elements
const youtubePlayer = document.getElementById('youtube-player');
const videoPlaybackTitle = document.getElementById('video-playback-title');
const videoPlaybackViews = document.getElementById('video-playback-views');
const videoPlaybackTime = document.getElementById('video-playback-time');
const videoPlaybackDescription = document.getElementById('video-playback-description');
const showMoreDescriptionBtn = document.getElementById('show-more-description-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const relatedVideosList = document.getElementById('related-videos-list');

// Shorts Playback Elements
const youtubeShortsPlayer = document.getElementById('youtube-shorts-player');
const backToShortsBtn = document.getElementById('back-to-shorts-btn');

// Profile Elements
const profileEmoji = document.getElementById('profile-emoji');
const profileChannelName = document.getElementById('profile-channel-name');
const profileFollowers = document.getElementById('profile-followers');
const profileFollowing = document.getElementById('profile-following');
const channelDescriptionInput = document.getElementById('channel-description');
const saveChannelDescriptionBtn = document.getElementById('save-channel-description-btn');
const channelTotalViews = document.getElementById('channel-total-views');
const profileVideosList = document.getElementById('profile-videos-list');
const profileShortsList = document.getElementById('profile-shorts-list');
const profileContentBtns = document.querySelectorAll('.profile-content-switcher button');


// --- Firebase References (initialized in HTML script block) ---
// const auth = firebase.auth();
// const database = firebase.database();
// const storage = firebase.storage();

let currentUserId = null;
let currentChannelName = null;

document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Authentication State Change ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            // Check if user has a channel name
            const userChannelRef = database.ref('users/' + currentUserId + '/channelName');
            const snapshot = await userChannelRef.once('value');
            if (snapshot.exists() && snapshot.val()) {
                currentChannelName = snapshot.val();
                showScreen('main-app-screen');
                loadHomeFeed(); // Load videos once logged in
                updateProfileUI(); // Update profile immediately
            } else {
                showScreen('login-screen'); // User is logged in, but needs to set channel name
                document.getElementById('login-box').style.display = 'block'; // Show channel creation part
            }
        } else {
            currentUserId = null;
            currentChannelName = null;
            showScreen('login-screen');
        }
    });

    // --- Event Listeners for UI Interactions ---

    // Login Screen Logic
    checkUsernameBtn.addEventListener('click', checkUsernameAvailability);
    createChannelBtn.addEventListener('click', createChannel);
    googleLoginBtn.addEventListener('click', signInWithGoogle);
    // facebookLoginBtn.addEventListener('click', signInWithFacebook); // Implement this for Facebook

    // Navigation Logic
    homeNavBtn.addEventListener('click', () => showContentSection('home-section', homeNavBtn));
    shortsNavBtn.addEventListener('click', () => showContentSection('shorts-section', shortsNavBtn));
    uploadNavBtn.addEventListener('click', () => showContentSection('upload-section', uploadNavBtn));
    profileNavBtn.addEventListener('click', () => showContentSection('profile-section', profileNavBtn));

    // Upload Section Logic
    uploadShortBtn.addEventListener('click', () => {
        shortUploadForm.style.display = 'block';
        videoUploadForm.style.display = 'none';
    });
    uploadVideoBtn.addEventListener('click', () => {
        videoUploadForm.style.display = 'block';
        shortUploadForm.style.display = 'none';
    });
    submitShortBtn.addEventListener('click', uploadShort);
    submitVideoBtn.addEventListener('click', uploadVideo);

    // Video Playback Screen Logic
    backToHomeBtn.addEventListener('click', () => showScreen('main-app-screen'));
    showMoreDescriptionBtn.addEventListener('click', toggleDescription);
    document.getElementById('video-list').addEventListener('click', handleVideoThumbnailClick); // For home screen videos
    document.getElementById('shorts-list').addEventListener('click', handleShortThumbnailClick); // For shorts screen

    // Profile Screen Logic
    saveChannelDescriptionBtn.addEventListener('click', saveChannelDescription);
    profileContentBtns.forEach(button => {
        button.addEventListener('click', (event) => {
            const contentType = event.target.dataset.content;
            showProfileContent(contentType, event.target);
        });
    });

    // Search Logic
    document.getElementById('search-btn').addEventListener('click', performSearch);

    // Populate Emojis for profile pic
    populateEmojis();
});


// --- Helper Functions for UI and Screen Management ---

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showContentSection(sectionId, clickedButton) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active-content');
    });
    document.getElementById(sectionId).classList.add('active-content');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

function showProfileContent(contentType, clickedButton) {
    document.querySelectorAll('.profile-content-grid').forEach(grid => {
        grid.classList.remove('active-profile-content');
    });
    document.getElementById(contentType + '-list').classList.add('active-profile-content');

    document.querySelectorAll('.profile-content-switcher button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    // Load content for the selected section
    if (contentType === 'profile-videos') {
        loadUserVideos(currentChannelName);
    } else if (contentType === 'profile-shorts') {
        loadUserShorts(currentChannelName);
    }
}


// --- Firebase Authentication & User Management ---

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        // auth.onAuthStateChanged will handle screen transition and channel check
    } catch (error) {
        console.error("Google login error:", error);
        alert("Google login failed: " + error.message);
    }
}

// Implement signInWithFacebook similarly
async function signInWithFacebook() {
    alert("Facebook login is not yet implemented.");
    // const provider = new firebase.auth.FacebookAuthProvider();
    // try {
    //     await auth.signInWithPopup(provider);
    // } catch (error) {
    //     console.error("Facebook login error:", error);
    //     alert("Facebook login failed: " + error.message);
    // }
}

async function checkUsernameAvailability() {
    const username = usernameInput.value.trim();
    if (username.length < 3) {
        usernameStatus.textContent = 'Channel name too short (min 3 characters).';
        usernameStatus.style.color = 'red';
        return false;
    }
    const usernameRef = database.ref('usernames/' + username.toLowerCase());
    const snapshot = await usernameRef.once('value');
    if (snapshot.exists()) {
        usernameStatus.textContent = 'Channel name already taken.';
        usernameStatus.style.color = 'red';
        return false;
    } else {
        usernameStatus.textContent = 'Channel name available!';
        usernameStatus.style.color = 'green';
        return true;
    }
}

async function createChannel() {
    if (!currentUserId) {
        alert("Please log in first.");
        return;
    }
    const username = usernameInput.value.trim();
    const selectedEmoji = selectedEmojiInput.value;

    if (!username || !selectedEmoji) {
        alert("Please enter a channel name and select an emoji.");
        return;
    }

    const isAvailable = await checkUsernameAvailability();
    if (!isAvailable) {
        return;
    }

    try {
        // Save channel name and emoji to user's profile and global usernames list
        await database.ref('users/' + currentUserId).update({
            channelName: username,
            profileEmoji: selectedEmoji,
            followers: 0,
            following: 0,
            totalViews: 0,
            description: ""
        });
        await database.ref('usernames/' + username.toLowerCase()).set(currentUserId);

        currentChannelName = username;
        alert("Channel created successfully!");
        showScreen('main-app-screen');
        loadHomeFeed(); // Load initial content
        updateProfileUI();
    } catch (error) {
        console.error("Error creating channel:", error);
        alert("Failed to create channel: " + error.message);
    }
}

function populateEmojis() {
    const emojis = ['😀', '😁', '😂', '🤣', '😅', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤩', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '😤', '😠', '😡', '🤬', '😈', '👿', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '👃', '🧠', '🫀', '🫁', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '🧑‍⚕️', '👨‍🎓', '👩‍🏫', '👨‍💻', '👩‍🎤', '🧑‍🍳', '👨‍🏭', '👩‍🔧', '🧑‍🌾', '👨‍🎨', '👩‍🚒', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🚶', '🏃', '👯', '🏌️', '🏄', '🏊', '🚣', '🏇', '🚴', '🚵', '🤸', '⛹️', '🏋️', '🤼', '🤹', '🧘', '🛀', '🛌', '🫂', '🗣️', '👤', '👥', '🫂', '🦴', '💩', '👻', '👾', '👽', '👹', '👺', '🤡', '🤠', '🥳', '😎', '🤓', '🧐', '🥳', '🥸', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠', '🫠']. For instance, some of the commonly used mathematical symbols and Greek letters are:
-   `\alpha` (alpha)
-   `\beta` (beta)
-   `\gamma` (gamma)
-   `\delta` (delta)
-   `\epsilon` (epsilon)
-   `\zeta` (zeta)
-   `\eta` (eta)
-   `\theta` (theta)
-   `\iota` (iota)
-   `\kappa` (kappa)
-   `\lambda` (lambda)
-   `\mu` (mu)
-   `\nu` (nu)
-   `\xi` (xi)
-   `\pi` (pi)
-   `\rho` (rho)
-   `\sigma` (sigma)
-   `\tau` (tau)
-   `\upsilon` (upsilon)
-   `\phi` (phi)
-   `\chi` (chi)
-   `\psi` (psi)
-   `\omega` (omega)
-   `\Gamma` (Gamma)
-   `\Delta` (Delta)
-   `\Theta` (Theta)
-   `\Lambda` (Lambda)
-   `\Xi` (Xi)
-   `\Pi` (Pi)
-   `\Sigma` (Sigma)
-   `\Upsilon` (Upsilon)
-   `\Phi` (Phi)
-   `\Psi` (Psi)
-   `\Omega` (Omega)

**Note:** The capitalized Greek letters (e.g., `\Alpha`) are generally the same as their English alphabet counterparts (A, B, etc.) and are not often used in mathematical notation.

---

I hope this structured approach helps you build your app! Let me know if you have more questions about specific parts.
