import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, Modal, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import styles from  '../styles/videoComponent.module.css'

const server_url = "http://localhost:8000";
const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function VideoMeet() {
  const [pinnedUser, setPinnedUser] = useState(null);
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoRef = useRef(null);
  const [video,setVideo] = useState(true);
  const [audio,setAudio] = useState(true);
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(true);
  let [messages, setMessages] = useState([])
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  const [videos, setVideos] = useState([]);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [askForUsername, setAskForUsername] = useState(true);
  const [screenAvailable,setScreenAvailable] = useState(true)
  const [username, setUsername] = useState("");
  const connections = useRef({});

  const getPermission = async () => {
    try {
      const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoAvailable,
        audio: audioAvailable
      });

      if (videoAvailable && video || audioAvailable && audio ) {
        window.localStream = userMediaStream;
        localVideoRef.current.srcObject = userMediaStream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  useEffect(() => {
    getPermission();
  }, []);

  const getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      console.error("Error stopping existing tracks:", error);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    if(video ===false && audio === false){
    let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream
  }
    for (let id in connections.current) {
      if (id === socketIdRef.current) continue;

      connections.current[id].addStream(window.localStream);
      connections.current[id]
        .createOffer()
        .then((description) => {
          connections.current[id].setLocalDescription(description);
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections.current[id].localDescription })
          );
        })
        .catch(console.error);
    }
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoAvailable,
        audio: audioAvailable,
      });
      getUserMediaSuccess(stream);
    } catch (error) {
      console.error("Error getting user media:", error);
    }
  };
  let gotMessageFromServer = (fromId, message) => {
    let signal = JSON.parse(message);
  
    // Ensure the connection exists
    if (!connections.current[fromId]) {
      console.warn(`Connection for ${fromId} not found!`);
      return;
    }
  
    let peerConnection = connections.current[fromId];
  
    if (signal.sdp) {
      peerConnection
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          // If the SDP is an offer, create an answer
          if (signal.sdp.type === "offer") {
            peerConnection.createAnswer().then((description) => {
              return peerConnection.setLocalDescription(description);
            })
            .then(() => {
              socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: peerConnection.localDescription }));
            })
            .catch((error) => console.error("Error creating answer:", error));
          }
        })
        .catch((error) => console.error("Error setting remote description:", error));
    }
  
    if (signal.ice) {
      if (peerConnection.remoteDescription) {
        peerConnection
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((error) => console.error("Error adding ICE candidate:", error));
      } else {
        console.warn("Remote description not set yet. Storing ICE candidate...");
        // Store the ICE candidate until remote description is set
        if (!peerConnection.iceQueue) peerConnection.iceQueue = [];
        peerConnection.iceQueue.push(signal.ice);
      }
    }
  };
  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
        socketRef.current.emit("join-call", window.location.href);
        socketIdRef.current = socketRef.current.id;

        socketRef.current.on("chat-message", addMessage);

        socketRef.current.on("user-left", (id) => {
            setVideos((videos) => videos.filter((video) => video.socketId !== id));
        });

        socketRef.current.on("user-joined", (id, clients) => {
            clients.forEach((socketListId) => {
                if (!connections.current[socketListId]) {
                    connections.current[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    // Wait for ICE candidates
                    connections.current[socketListId].onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
                        }
                    };

                    // Handle remote video streams
                    connections.current[socketListId].ontrack = (event) => {
                        setVideos((videos) => {
                            let videoExists = videos.find((video) => video.socketId === socketListId);

                            if (videoExists) {
                                return videos.map((video) =>
                                    video.socketId === socketListId ? { ...video, stream: event.streams[0] } : video
                                );
                            } else {
                                return [...videos, { socketId: socketListId, stream: event.streams[0], autoplay: true, playsInline: true }];
                            }
                        });
                    };

                    // Add local stream if available
                    if (window.localStream) {
                        window.localStream.getTracks().forEach((track) => {
                            connections.current[socketListId].addTrack(track, window.localStream);
                        });
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections.current[socketListId].addStream(window.localStream);
                    }
                }
            });

            if (id === socketIdRef.current) {
                for (let id2 in connections.current) {
                    if (id2 === socketIdRef.current) continue;

                    try {
                        if (window.localStream) {
                            window.localStream.getTracks().forEach((track) => {
                                connections.current[id2].MediaStream(track, window.localStream);
                            });
                        }
                    } catch (e) {
                        console.log("Error adding tracks to peer connection: ", e);
                    }

                    connections.current[id2]
                        .createOffer()
                        .then((description) => {
                            connections.current[id2].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", id2, JSON.stringify({ sdp: connections.current[id2].localDescription }));
                            });
                        })
                        .catch((e) => console.log("Error creating offer: ", e));
                }
            }
        });
    });
};


let silence = () => {
  let ctx = new AudioContext()
  let oscillator = ctx.createOscillator()
  let dst = oscillator.connect(ctx.createMediaStreamDestination())
  oscillator.start()
  ctx.resume()
  return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
}
let black = ({ width = 640, height = 480 } = {}) => {
  let canvas = Object.assign(document.createElement("canvas"), { width, height })
  canvas.getContext('2d').fillRect(0, 0, width, height)
  let stream = canvas.captureStream()
  return Object.assign(stream.getVideoTracks()[0], { enabled: false })
}

 

  const connect = () => {
    setAskForUsername(false);
    getUserMedia().then(connectToSocketServer);
  };

  let handleVideo = () => {
    setVideo((prev) => {
      if (window.localStream) {
        window.localStream.getVideoTracks().forEach((track) => {
          track.enabled = !prev; // Toggle video track state
        });
      }
      return !prev;
    });
  };
let getDislayMediaSuccess = (stream) => {
    console.log("HERE");

    try {
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }
    } catch (e) {
        console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections.current) {
        if (id === socketIdRef.current) continue;

        if (connections.current[id].getSenders) {
            let videoTrack = stream.getVideoTracks()[0];
            let sender = connections.current[id].getSenders().find(s => s.track.kind === videoTrack.kind);
            if (sender) sender.replaceTrack(videoTrack);
        }

        connections.current[id]
            .createOffer()
            .then((description) => {
                connections.current[id].setLocalDescription(description);
                socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections.current[id].localDescription })
                );
            })
            .catch(console.error);
    }

    // Handle screen share stop and switch back to webcam
    stream.getTracks().forEach(track => {
        track.onended = async () => {
            console.log("Screen share ended, switching back to webcam.");
            setScreen(false);

            try {
                // Stop the screen share stream but NOT the webcam
                stream.getTracks().forEach(track => track.stop());

                // Restart webcam
                let newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                window.localStream = newStream;
                localVideoRef.current.srcObject = newStream;

                // Replace screen track with webcam track in all connections
                for (let id in connections.current) {
                    if (id === socketIdRef.current) continue;

                    if (connections.current[id].getSenders) {
                        let videoTrack = newStream.getVideoTracks()[0];
                        let sender = connections.current[id].getSenders().find(s => s.track.kind === videoTrack.kind);
                        if (sender) sender.replaceTrack(videoTrack);
                    }

                    connections.current[id]
                        .createOffer()
                        .then((description) => {
                            connections.current[id].setLocalDescription(description);
                            socketRef.current.emit(
                                "signal",
                                id,
                                JSON.stringify({ sdp: connections.current[id].localDescription })
                            );
                        })
                        .catch(console.error);
                }
            } catch (e) {
                console.log("Error switching back to webcam: ", e);
            }
        };
    });
};

let getDisplayMedia = () => {
    if (!screen) {  // Prevent unnecessary calls
        if (navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDislayMediaSuccess)
                .catch((e) => console.log(e));
        }
    }
};

const handlePin = (video) => {
    setPinnedUser(video);
};

  let handleEnd =() =>{
    window.location.href = 'http://localhost:5173/home'
  }

let handleMessage = (e) => {
  setMessage(e.target.value);
}

const addMessage = (data, sender, socketIdSender) => {
  setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data }
  ]);
  if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
  }
};

let sendMessage = () => {
  console.log(socketRef.current);
  socketRef.current.emit('chat-message', message, username)
  // setMessage("");
  setNewMessages(newMessages+1)
  // this.setState({ message: "", sender: username })
}
 
  // Function to clear the chat
  const clearChat = () => {
    setMessages([]);
    setNewMessages(0);
  };

let handleChat=()=>{
  setModal(!showModal)
}

  let handleAudio = () => {
    setAudio((prev) => {
      if (window.localStream) {
        window.localStream.getAudioTracks().forEach((track) => {
          track.enabled = !prev; // Toggle audio track state
        });
      }
      return !prev;
    });
  };

  useEffect(() =>{
    if(screen !== undefined){
      getDisplayMedia();
    }
  },[screen])

  let handleScreen=() =>{
    setScreen(!screen)
  }
  
  return (
  <div>
    {askForUsername ? (
      <div>
        <h1>Enter into Lobby</h1>
        <TextField
          id="outlined-basic"
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button variant="contained" onClick={connect}>
          Connect
        </Button>
        <div>
          <video ref={localVideoRef} autoPlay muted></video>
        </div>
      </div>
    ) : (
      <div className={styles.meetVideoContainer}>

        {/* Top Participants Row */}
        <div className={styles.participantsRow}>
          {videos
            .filter((video) => video.socketId !== pinnedUser?.socketId)
            .map((video) => (
              <video
                key={video.socketId}
                className={styles.participantVideo}
                ref={(el) => el && (el.srcObject = video.stream)}
                autoPlay
                onClick={() => handlePin(video)}
              ></video>
            ))}
        </div>

        {/* Center Pinned Video */}
        <div className={styles.pinnedVideoContainer}>
          {pinnedUser ? (
            <video
              className={styles.pinnedVideo}
              ref={(el) => el && (el.srcObject = pinnedUser.stream)}
              autoPlay
            ></video>
          ) : (
            <p style={{ color: "white" }}>Click a participant to pin them</p>
          )}
        </div>

        {/* Self-View (Bottom Left) */}
        <video
          className={styles.meetUserVideo}
          ref={localVideoRef}
          autoPlay
          muted
        ></video>

        {/* Control Buttons */}
        <div className={styles.buttonContainers}>
          <IconButton onClick={handleVideo} style={{ color: "white" }}>
            {video ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
          <IconButton onClick={handleEnd} style={{ color: "red" }}>
            <CallEndIcon />
          </IconButton>
          <IconButton onClick={handleAudio} style={{ color: "white" }}>
            {audio ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
          {screenAvailable && (
            <IconButton onClick={handleScreen} style={{ color: "white" }}>
              {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
            </IconButton>
          )}
          <Badge badgeContent={newMessages} max={999} color="secondary">
            <IconButton onClick={handleChat} style={{ color: "white" }}>
              <ChatIcon />
            </IconButton>
          </Badge>
        </div>

        {/* Chat Room */}
        {showModal && (
          <div className={styles.chatRoom}>
            <div className={styles.chatContainer}>
              <h1>Chat</h1>
              <div className={styles.chattingDisplay}>
                {messages.length ? (
                  messages.map((item, index) => (
                    <div style={{ marginBottom: "20px" }} key={index}>
                      <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                      <p>{item.data}</p>
                    </div>
                  ))
                ) : (
                  <p>No Messages Yet</p>
                )}
              </div>
              <div className={styles.chattingArea}>
                <TextField
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  label="Enter your chat"
                  variant="outlined"
                />
                <Button variant="contained" onClick={sendMessage}>
                  Send
                </Button>
                <Button variant="contained" onClick={clearChat}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);
}
export default VideoMeet;
