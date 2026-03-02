import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import withAuth from "../utils/withAuth";
import "../App.css";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const extractMeetingCode = (value) => {
    const raw = value.trim();
    if (!raw) return "";

    try {
      const parsedUrl = new URL(raw);
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      return segments[segments.length - 1] || "";
    } catch (_) {
      const segments = raw.split("/").filter(Boolean);
      return segments[segments.length - 1] || raw;
    }
  };

  const handleJoinVideoCall = async () => {
    const normalizedCode = extractMeetingCode(meetingCode);

    if (normalizedCode) {
      try {
        navigate(`/${normalizedCode}`);
      } catch (error) {
        console.error("Failed to join video call:", error);
      }
    } else {
      alert("Please enter a valid meeting code.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const goToHistory = () => {
    navigate("/history");
  };

  return (
    <>
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Apna Video Call</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={goToHistory}>
            <RestoreIcon />
          </IconButton>
          <p>History</p>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <h2>Providing Quality Video Calls Just Like Quality Education</h2>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <TextField
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              id="outlined-basic"
              label="Meeting Code"
              variant="outlined"
              fullWidth
            />
            <Button onClick={handleJoinVideoCall} variant="contained">
              Join
            </Button>
          </div>
        </div>
        <div className="rightPanel">
          <img src="/logo3.png" alt="Apna Video Call Logo" style={{ maxWidth: "100%" }} />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);