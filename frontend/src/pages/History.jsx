import React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const dummyData = [
    {
        meetingCode: 'A1B2C3',
        date: '2023-08-25T14:30:00Z'
    },
    {
        meetingCode: 'D4E5F6',
        date: '2023-09-10T09:00:00Z'
    },
    {
        meetingCode: 'G7H8I9',
        date: '2023-10-05T18:45:00Z'
    }
];

export default function History() {
    const routeTo = useNavigate();

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
            {dummyData.length !== 0 ? (
                dummyData.map((e, i) => (
                    <Card key={i} variant="outlined">
                        <CardContent>
                            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                Code: {e.meetingCode}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                Date: {formatDate(e.date)}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <></>
            )}
        </div>
    );
}
