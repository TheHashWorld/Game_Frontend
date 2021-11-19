// create Agora client
var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

var localTracks = {
  audioTrack: null
};
var remoteUsers = {};
// Agora client options
var options = {
  appid: null,
  channel: null,
  uid: null,
  token: null
};
var printLog= true

VideoCall = {
  jscallback:null,
  joinChannel: async function (appid,channel,token,account) {
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    if(printLog){
      console.log("joinChannel appid="+appid+",channel="+channel+",token="+token)
    }
  // join a channel and create local tracks, we can use Promise.all to run them concurrently
    [ options.uid, localTracks.audioTrack ] = await Promise.all([
      // join the channel
      client.join(appid, channel, token ,account),
      // create local tracks, using microphone and camera
      AgoraRTC.createMicrophoneAudioTrack(),
      // AgoraRTC.createCameraVideoTrack()
    ]);
  
    // play local video track
    // localTracks.videoTrack.play("local-player");

    // publish local tracks to channel
    await client.publish(Object.values(localTracks));
    console.log("publish success");
  },
  leaveChannel:async function(){
    for (trackName in localTracks) {
      var track = localTracks[trackName];
      if(track) {
        track.stop();
        track.close();
        localTracks[trackName] = undefined;
      }
    }
  
    // remove remote users and player views
    remoteUsers = {};
  
    // leave the channel
    await client.leave();
    console.log("client leaves channel success");
  },
}

async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
}

function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
  const id = user.uid;
  delete remoteUsers[id];
}