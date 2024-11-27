import express from "express";
const app = express();

import {v4 as uuidv4} from "uuid";
import jwt, {Secret, JwtPayload} from 'jsonwebtoken';
import multer from "multer";
const upload = multer({dest: 'uploads/'});
const secretKey: Secret = "tanmay";
const port: number = 3003;

const user: User[] = [{
    "id": "2222",
    "username": "tanmay",
    "email": "tanmay11",
    "password": "123",
    "channelId": "fkjvf"
}];

interface User {
    "id": string,
    "username": string,
    "email": string,
    "password": string,
    "channelId": string
};

interface Videos {
    "id": string,
    "title": string,
    "thumbnail_url": string,
    "creator": {
        "id": string,
        "username": string
    },
    "view_count": number,
    "created_at": number,
    "status": string,
    "current_timestamp": number,
    "video_urls": {
        "240p": string | null,
        "480p": string | null,
        "720p": string | null
    }
}

const videos: Videos[] = [];

interface Channel {
    "id": string,
    "name": string,
    "description": string,
    "slug": string,
    "subscriber_count": number,
    "videos": [{
        "id": string,
        "title": string,
        "thumbnail": string
    }] | null,
}

const channels: Channel[] = []

app.use(express.json());

app.post('/api/auth/signup', (req: any, res: any) => {
    const email: string = req.body.email;
    const username: string = req.body.username;
    const password: string = req.body.password;

    if (!email || !username || !password){
        return res.status(400).json("Validation errors");
    }

    for (let i = 0; i < user.length; i++) {
        if(user[i].username === username || user[i].email === email) {
            return res.status(409).json("Username or email already exist");
        }
    }

    let uuid = uuidv4();

    user.push({
        "id": uuid,
        "username": username,
        "email": email,
        "password": password,
        "channelId": ""
    })
    return res.status(200).json("User created successfully");
})


app.post('/api/auth/login', (req: any, res: any) => {
    const {email, password} = req.body;
    if(!email || !password) {
        return res.status(400).json("Validation errors");
    }

    for(let i = 0; i < user.length; i++) {
        if(user[i].email === email && user[i].password === password) {
            const token: string | JwtPayload = jwt.sign({id: user[i].id, username: user[i].username}, secretKey, {
                expiresIn: '2 days',
            });
            res.cookie('Authentication', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            });
            return res.status(200).json({
                "access_token": token,
                "user": {
                    "id": user[i].id,
                    "username": user[i].username,
                    "email": user[i].email
                }
            });
        }
    }
    return res.status(400).json("Bhag ja")
})

app.get('/api/videos/feed', (req: any, res: any) => {
    const page = Number(req.query.page) || 1;
    const limit: number = Number(req.query.limit) || 20;
    const category = req.query.category || "";

    let videoArray: any = [];

    for (let i = limit*(page-1); i < limit; i++) {
        videoArray.push({
            "id": videos[i].id,
            "title": videos[i].title,
            "thumbnail_url": videos[i].thumbnail_url,
            "creator": {
                "id": videos[i].creator.id,
                "username": videos[i].creator.username
            },
            "view_count": videos[i].view_count,
            "created_at": videos[i].created_at,
        })
    }
    return res.status(200).json({"videos": videoArray, "total_pages": videos.length/limit, "current_page": page});
})

app.post('/api/channels', (req: any, res: any) => {
    const {name, description, slug} = req.body;
    const authToken = req.cookies.Authentication;
    let userId;
    let username;
    if (!authToken) {
        return res.status(400).json("Validation Errors")
    };
    jwt.verify(authToken, secretKey, (err: any, decoded: any) => {
        if(err) {
            return res.status(400).json("Validation Erros");
        }
        else {
            userId = decoded.id;
            username = decoded.username
        }
    });

    if(!name || !description || !slug) {
        return res.status(400).json("Validation Errors");
    }

    for (let i = 0; i < channels.length; i++) {
        if(channels[i].slug === slug){
            return res.status(409).json("Slug already exist")
        }
    }


    for (let i = 0; i < user.length; i++){
        if(userId === user[i].id) {
            if(user[i].channelId == "") {
                // run the code
                let uuid = uuidv4();
                user[i].channelId = uuid;
                channels.push({"id": uuid, "name": name, "description": description, "slug": slug, "subscriber_count": 0, "videos": null})
                return res.status(201).json("Channel created successfully")
            }  
            else {
                return res.status(411).json("User already has a channel")
            }
        }
    }
})

app.get('/api/channels/:slug', (req: any, res: any) => {
    const authToken = req.cookies.Authentication;
    let userId;
    let username;
    const slug = String(req.params);
    if (!authToken) {
        return res.status(400).json("Validation Errors")
    };
    jwt.verify(authToken, secretKey, (err: any, decoded: any) => {
        if(err) {
            return res.status(400).json("Validation Erros");
        }
        else {
            userId = decoded.id;
            username = decoded.username
        }
    });

    for (let i = 0; i < channels.length; i++) {
        if(channels[i].slug == slug) {
            return res.status(200).json(channels[i]);
        }
    }
    return res.status(400).json("Slug not found")
})

app.post('/api/videos/upload', upload.single('file'),(req: any, res: any) => {
    console.log(req.file);
    console.log(req.body.name);

    let uuid = uuidv4();

    // pehle user id se channel Id nikalo aur fir video channel aur video ke array me dalo

    return res.status(200).json({
        "id": uuid,
        "title": req.body.title,
        "processing_status": "PROCESSING",
        "qualities": ["240", "480", "720"]
    })
})

app.get('/api/videos/:video_id', (req: any, res: any) => {
    return res.status(200).json({
        "id": "video_uuid",
        "title": "Video Title",
        "description": "Video description",
        "creator": {
          "id": "creator_uuid",
          "username": "creator_username"
        },
        "status": "PROCESSING"
      })
})

app.listen(port, () => {
    console.log(`Port is running on ${port}`);
})