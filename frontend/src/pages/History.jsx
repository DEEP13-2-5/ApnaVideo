import React, { useContext, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import withAuth from '../utils/withAuth';

function History() {
    const routeTo = useNavigate();
    const { getUserHistory } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getUserHistory();
                if (Array.isArray(data)) {
                    setMeetings(data);
                    setLoadError('');
                } else {
                    setLoadError(data?.message || 'Unable to load meeting history.');
                }
            } catch (error) {
                console.error("Failed to load history:", error);
                setLoadError(error?.response?.data?.message || 'Failed to load history. Please try again.');
            }
        };

        fetchHistory();
    }, [getUserHistory]);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    return (
        <div>
            <IconButton onClick={() => routeTo('/home')}>
                <HomeIcon />
            </IconButton>
            {meetings.length !== 0 ? (
                meetings.map((e, i) => (
                    <Card key={i} variant="outlined">
                        <CardContent>
                            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                Code: {e.meetingCode || e.meetingcode}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                Date: {formatDate(e.date)}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Typography sx={{ m: 2 }} color="text.secondary">
                    {loadError || 'No meeting history yet.'}
                </Typography>
            )}
        </div>
    );
}

export default withAuth(History);
