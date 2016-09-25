//TODO make this a .ts file?
var express = require('express');
var app = express();
//var http = require('http').Server(app);
//var io = require('socket.io')(http);
var mongojs = require('mongojs');
var db = mongojs('mongodb://admin:admin123@ds015713.mlab.com:15713/novel_n', ['notes', 'users', 'edges']);
/*var gdb = require('seraph')({
  //server: 'https://neo-heroku-ova-tromp-greenyellow.digital-ocean.graphstory.com:7473',
  user: 'neo_heroku_ova_tromp_greenyellow',
  pass: 'o8srgZVq9ZsnVZVC8QLJkX7HsrSsoGyhX7la3rpE'
});*/
var url = require('url').parse('http://app56614688-dYRNeO:6pQjlv4oiV5HXJBrqZp8@hobby-giphgfjnbmnagbkepekepdnl.dbs.graphenedb.com:24789');
var gdb = require("seraph")({
    server: url.protocol + '//' + url.host,
    user: url.auth.split(':')[0],
    pass: url.auth.split(':')[1]
});
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');
var secret = 'ieatbats';
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
// setup view engine? 
//app.set('views', path.join(__dirname, 'views'));
//app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'html');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use('/node_modules', express.static('node_modules'));
app.use('/app', express.static('app'));
//TODO why are these necessary? is the slash necessary?
app.get('/styles.css', function (req, res) {
    res.sendFile(path.join(__dirname, '/styles.css'));
});
app.get('/systemjs.config.js', function (req, res) {
    res.sendFile(path.join(__dirname, 'systemjs.config.js'));
});
//TODO split into routes
var getToken = function (profile, callback) {
    var payload = {
        created: new Date(),
        username: profile.username,
        user_id: profile.user_id,
        root_id: profile.root_id
    };
    console.log('new token payload', payload);
    jwt.sign(payload, secret, {}, callback);
};
var checkToken = function (req, res, next) {
    jwt.verify(req.headers.token, secret, function (err, payload) {
        if (err) {
            res.status(401).json({ message: 'authentication required' });
        }
        else {
            var t0 = new Date(payload.created);
            var t1 = new Date();
            if (t1 - t0 >= 1000000000) {
                res.status(401).json({ message: 'authentication required (token expired)' });
            }
            else {
                console.log('check token payload', payload);
                req.headers.username = payload.username;
                req.headers.user_id = payload.user_id;
                req.headers.root_id = payload.root_id;
                next();
            }
        }
    });
};
app.post('/api/register', function (req, res, next) {
    var signature = req.body;
    if (typeof (signature.username) == 'string' &&
        typeof (signature.password) == 'string') {
        gdb.query("MATCH (u:User{username:{username}})\n      RETURN u", signature, function (err, result) {
            if (err) {
                res.status(500).send(err);
            }
            else if (result.length > 0) {
                res.status(402).json({ message: 'username unavailable' });
            }
            else {
                var params = {
                    user: {
                        username: signature.username,
                        hash: passwordHash.generate(signature.password),
                        email: signature.email,
                        width: 10000,
                        height: 10000,
                        gravity: 0.01,
                        friction: .8,
                        linkDistance: 250,
                        linkStrength: 0.25,
                        charge: -5700,
                        theta: 0.8,
                        alpha: 0.1,
                        textHeight: 400
                    },
                    note: {
                        degree: 0,
                        x: 0,
                        y: 0,
                        z: 0,
                        fixed: true,
                        secret: false,
                        showMeasurement: true,
                        showParagraph: true,
                        showDefinitions: false,
                        showPresentations: false,
                        showEquations: false,
                        framed: 0,
                        currented: 0,
                        x_currented: 0
                    },
                    nexus_ids: [] // TODO add nexuses to view of new user
                };
                gdb.query(// there should exist a bijection from user_ids to root_ids09
                "CREATE (u:User)-[write:ACT]->(n:Note:Root)-[read:ACT]->(u),\n            (u)-[root:ROOT]->(n),\n            (u)-[frame:FRAME]->(n),\n            (u)-[current:CURRENT]->(n)\n            SET u.created = timestamp(),\n            u += {user},\n            n.created = timestamp(),\n            n.root_id = id(n),\n            n += {note},\n            write.created = timestamp(),\n            read.created = timestamp(),\n            root.created = timestamp(),\n            frame.created = timestamp(),\n            current.created = timestamp()\n            RETURN {\n              username: u.username,\n              user_id: id(u),\n              root_id: id(n)\n            }", params, function (err, result) {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else {
                        console.log('register', result);
                        var profile_1 = result[0];
                        getToken(profile_1, function (err, token) {
                            if (err) {
                                res.status(500).send(err);
                            }
                            else {
                                res.json({
                                    token: token,
                                    username: profile_1.username,
                                    user_id: profile_1.user_id,
                                    root_id: profile_1.root_id
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    else {
        res.status(400).json({ message: '(username, password) required' });
    }
});
app.post('/api/login', function (req, res, next) {
    var signature = req.body;
    if (typeof (signature.username) == 'string' &&
        typeof (signature.password) == 'string') {
        gdb.query("MATCH (u:User)-[:ROOT]->(n:Note:Root) WHERE u.username = {username}\n      RETURN {\n        username: u.username,\n        user_id: id(u),\n        root_id: id(n)\n      }", signature, function (err, result) {
            //console.log(result);
            if (err) {
                res.status(500).send(err);
            }
            else if (result.length == 1) {
                var profile_2 = result[0];
                if (passwordHash.verify(signature.password, profile_2.hash)) {
                    getToken(profile_2, function (err, token) {
                        if (err) {
                            res.status(500).send(err);
                        }
                        else {
                            res.json({
                                token: token,
                                username: profile_2.username,
                                user_id: profile_2.user_id,
                                root_id: profile_2.root_id
                            });
                        }
                    });
                }
                else {
                    res.status(401).json({ message: '(username, password) invalid' });
                }
            }
            else {
                res.status(401).json({ message: '(username, password) invalid' });
            }
        });
    }
    else {
        res.status(400).json({ message: '(username, password) required' });
    }
});
app.post('/api/verifytoken', checkToken, function (req, res, next) {
    // checkToken should 401 if token invalid?
    console.log('verifytoken');
    res.json({
        token: req.headers.token,
        username: req.headers.username,
        user_id: req.headers.user_id,
        root_id: req.headers.root_id
    });
});
app.get('/api/notation', checkToken, function (req, res, next) {
    var params = {
        user_id: req.headers.user_id,
        root_id: req.headers.root_id
    };
    // each user defines their own terms, forming tree of categorization
    // users can present terms to other terms, forming chains/flows of contiguous, different terms
    // users can EQUATE terms to other terms, proposing different resonance structures to represent a single term
    // (let us cultivate poetic naturalism)
    // aggregate user's relations to define transition-probabilities
    // look for gradients, resonance structures, other fun stuff
    // TODO add nexuses as separate from notes? or part of notes?
    // one frame per root, frame.root_id = id(root)
    // nexuses included in notes
    // (generic/part)-DEFINE->(specific/whole)
    // (prior)-PRESENT->(posterior)
    // (formula0)-EQUATE->(formula1)
    gdb.query("MATCH (u:User) WHERE id(u) = {user_id}\n    MATCH (u)-[:ROOT]->(r:Note:Root) WHERE id(r) = {root_id}\n    MATCH (u)-[:FRAME]->(f:Note) WHERE f.root_id = {root_id}\n    MATCH (u)-[:CURRENT]->(c:Note)\n    MATCH (u)<-[:ACT]-(n:Note)\n    OPTIONAL MATCH (n)--(target:Note)\n    OPTIONAL MATCH (n)<-[d0:DEFINE]-(target) WHERE d0.root_id = {root_id} AND n.root_id = target.root_id\n    OPTIONAL MATCH (n)-[d1:DEFINE]->(target) WHERE d1.root_id = {root_id} AND n.root_id = target.root_id\n    OPTIONAL MATCH (n)<-[x_d0:DEFINE]-(target) WHERE x_d0.root_id <> {root_id} AND n.root_id = target.root_id\n    OPTIONAL MATCH (n)-[x_d1:DEFINE]->(target) WHERE x_d1.root_id <> {root_id} AND n.root_id = target.root_id\n    OPTIONAL MATCH (n)<-[p0:PRESENT]-(target) WHERE p0.root_id = {root_id}\n    OPTIONAL MATCH (n)-[p1:PRESENT]->(target) WHERE p1.root_id = {root_id}\n    OPTIONAL MATCH (n)<-[x_p0:PRESENT]-(target) WHERE x_p0.root_id <> {root_id}\n    OPTIONAL MATCH (n)-[x_p1:PRESENT]->(target) WHERE x_p1.root_id <> {root_id}\n    OPTIONAL MATCH (n)<-[e0:EQUATE]-(target) WHERE e0.root_id = {root_id}\n    OPTIONAL MATCH (n)-[e1:EQUATE]->(target) WHERE e1.root_id = {root_id}\n    OPTIONAL MATCH (n)<-[x_e0:EQUATE]-(target) WHERE x_e0.root_id <> {root_id}\n    OPTIONAL MATCH (n)-[x_e1:EQUATE]->(target) WHERE x_e1.root_id <> {root_id}\n    WITH u, r, f, c, n, target, d0, d1, p0, p1, e0, e1,\n      collect(x_d0) AS x_d0s,\n      collect(x_d1) AS x_d1s,\n      collect(x_p0) AS x_p0s,\n      collect(x_p1) AS x_p1s,\n      collect(x_e0) AS x_e0s,\n      collect(x_e1) AS x_e1s\n    WITH u, r, f, c, n, CASE\n      WHEN target IS NOT NULL\n      THEN collect({\n        source_id: id(n),\n        target_id: id(target),\n        define: {\n          in: d0,\n          extra_ins: x_d0s,\n          out: d1,\n          extra_outs: x_d1s\n        },\n        present: {\n          in: p0,\n          extra_ins: x_p0s,\n          out: p1,\n          extra_outs: x_p1s\n        },\n        equate: {\n          in: e0,\n          extra_ins: x_e0s,\n          out: e1,\n          extra_outs: x_e1s\n        }\n      })\n      ELSE [] END AS relations\n    RETURN {\n      settings: {\n        root_id: id(r),\n        frame_id: id(f),\n        current_id: id(c),\n        username: u.username,\n        user_id: id(u),\n        email: u.email,\n        width: u.width,\n        height: u.height,\n        gravity: u.gravity,\n        friction: u.friction,\n        linkDistance: u.linkDistance,\n        linkStrength: u.linkStrength,\n        charge: u.charge,\n        theta: u.theta,\n        alpha: u.alpha,\n        textHeight: u.textHeight\n      },\n      notes: collect({\n        node: n,\n        relations: relations\n      })\n    }", params, function (err, result) {
        if (err) {
            res.status(500).send(err);
        }
        else {
            console.log('get notation', result);
            res.json(result[0]);
        }
    });
});
app.post('/api/selection', checkToken, function (req, res, next) {
    // TODO collapse specific tree, TODO remove extra_note from view
    var update = req.body;
    console.log(update);
    if (update.frame || update.current) {
        var params = {
            user_id: req.headers.user_id,
            root_id: req.headers.root_id,
            node_id: update.target_id,
            x: update.x,
            y: update.y,
            z: update.z
        };
        var query = '';
        if (update.frame) {
            query += "MATCH (u:User)-[:ACT]->(n1:Note)-[:ACT]->(u) \n        WHERE id(u) = {user_id} AND id(n1) = {node_id} and n1.root_id = {root_id}\n        MATCH (u)-[f0:FRAME]->(n0:Note)\n        SET n0.framed = n0.framed + timestamp() - f0.created,\n        DELETE f0\n        CREATE (u)-[f1:FRAME]->(n1)\n        SET f1.created = timestamp(),\n        n1.x = {x},\n        n1.y = {y},\n        n1.z = {z}";
            if (update.current) {
                query += " WITH u, n1, f1\n        MATCH (u)-[c0:CURRENT]->(n0:Note)  \n        FOREACH(n0_is_endo IN CASE WHEN n0.root_id = {root_id} THEN [1] ELSE [] END |\n          SET n0.currented = n0.currented + timestamp() - c0.created\n        )\n        FOREACH(n0_is_extra IN CASE WHEN n0.root_id <> {root_id} THEN [1] ELSE [] END |\n          SET n0.x_currented = n0.x_currented + timestamp() - c0.created\n        )\n        DELETE c0\n        CREATE (u)-[c1:CURRENT]->(n1)\n        SET c1.created = timestamp()\n        RETURN n1, f1, c1";
            }
            else {
                query += ' RETURN n1, f1';
            }
        }
        else if (update.current) {
            query += "MATCH (u:User)<-[:ACT]-(n1:Note)\n        WHERE id(u) = {user_id} AND id(n1) = {node_id}\n        MATCH (u)-[c0:CURRENT]->(n0:Note)\n        FOREACH(n0_is_cis IN CASE WHEN n0.root_id = {root_id} THEN [1] ELSE [] END |\n          SET n0.currented = n0.currented + timestamp() - c0.created\n        )\n        FOREACH(n0_is_extra IN CASE WHEN n0.root_id <> {root_id} THEN [1] ELSE [] END |\n          SET n0.x_currented = n0.x_currented + timestamp() - c0.created\n        )\n        DELETE c0\n        CREATE (u)-[c1:CURRENT]->(n1)\n        SET c1.created = timestamp(),\n        n1.x = {x},\n        n1.y = {y},\n        n1.z = {z}\n        RETURN n1, c1";
        }
        gdb.query(query, params, function (err, result) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                console.log('select', result);
                res.json(result[0]);
            }
        });
    }
    else {
        res.status(400).json({ message: 'invalid data' });
    }
});
// TODO add nexus notes; include fun facts in the demo
app.post('/api/note', checkToken, function (req, res, next) {
    // (nodes are posted with just coordinates; text is updated in subsequent puts)
    var note = req.body;
    if (typeof (note.x) == 'number' &&
        typeof (note.y) == 'number' &&
        typeof (note.z) == 'number' &&
        typeof (note.fixed) == 'boolean' &&
        typeof (note.secret) == 'boolean' &&
        typeof (note.showMeasurement) == 'boolean' &&
        typeof (note.showParagraph) == 'boolean' &&
        typeof (note.showDefinitions) == 'boolean' &&
        typeof (note.showPresentations) == 'boolean' &&
        typeof (note.showEquations) == 'boolean' &&
        typeof (note.present) == 'boolean' &&
        typeof (note.equate) == 'boolean') {
        var params = {
            user_id: req.headers.user_id,
            root_id: req.headers.root_id,
            node: {
                x: note.x,
                y: note.y,
                z: note.z,
                fixed: note.fixed,
                secret: note.secret,
                showMeasurement: note.showMeasurement,
                showParagraph: note.showParagraph,
                showDefinitions: note.showDefinitions,
                showPresentations: note.showPresentations,
                showEquations: note.showEquations,
                framed: 0,
                currented: 0,
                x_currented: 0
            }
        };
        var query = "MATCH (u:User)-[:FRAME]->(frame:Note)\n      WHERE id(u) = {user_id}";
        if (note.present || note.equate) {
            query += "MATCH (u)-[:CURRENT]->(current:Note)";
        }
        query += "CREATE (u)-[write:ACT]->(n:Note)-[read:ACT]->(u),\n      (frame)-[d:DEFINE]->(n)";
        if (note.present) {
            query += ", (current)-[p:PRESENT]->(n)";
        }
        if (note.equate) {
            query += ", (current)-[e:EQUATE]->(n)";
        }
        query += " SET n.created = timestamp(),\n      n.root_id = {root_id},\n      n.degree = frame.degree + 1,\n      n += {node},\n      write.created = timestamp(),\n      read.created = timestamp(),\n      d.created = timestamp(),\n      d.root_id = {root_id}";
        if (note.present) {
            query += ", p.created = timestamp(), p.root_id = {root_id}";
        }
        if (note.equate) {
            query += ", e.created = timestamp(), e.root_id = {root_id}";
        }
        // run a match to coalesce relations, in case frame and current are the same note
        query += " WITH n\n      MATCH (n)--(target:Note)\n      OPTIONAL MATCH (n)<-[d0:DEFINE]-(target)\n      OPTIONAL MATCH (n)<-[p0:PRESENT]-(target)\n      OPTIONAL MATCH (n)<-[e0:EQUATE]-(target)\n      WITH n, collect({\n        source_id: id(n),\n        target_id: id(target),\n        define: {\n          in: d0\n        },\n        present: {\n          in: p0\n        },\n        equate: {\n          in: e0\n        }\n      }) AS relations\n      RETURN {\n        node: n,\n        relations: relations\n      }";
        gdb.query(query, params, function (err, result) {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            }
            else {
                console.log('post note', result);
                res.json(result[0]);
            }
        });
    }
    else {
        console.error('invalid post note', note);
        res.status(400).json({ message: 'invalid data' });
    }
});
app.put('/api/node/:id', checkToken, function (req, res, next) {
    var node = req.body;
    console.log('put node', node);
    if (typeof (node.secret) == 'boolean' &&
        typeof (node.x) == 'number' &&
        typeof (node.y) == 'number' &&
        typeof (node.z) == 'number' &&
        typeof (node.fixed) == 'boolean' &&
        typeof (node.showMeasurement) == 'boolean' &&
        typeof (node.showParagraph) == 'boolean' &&
        typeof (node.showDefinitions) == 'boolean' &&
        typeof (node.showPresentations) == 'boolean' &&
        typeof (node.showEquations) == 'boolean') {
        var params = {
            user_id: req.headers.user_id,
            root_id: req.headers.root_id,
            node_id: parseInt(req.params.id),
            node: {
                secret: node.secret,
                x: node.x,
                y: node.y,
                z: node.z,
                fixed: node.fixed,
                showMeasurement: node.showMeasurement,
                showParagraph: node.showParagraph,
                showDefinitions: node.showDefinitions,
                showPresentations: node.showPresentations,
                showEquations: node.showEquations
            }
        };
        if (typeof (node.name) == 'string') {
            params.node.name = node.name;
        }
        if (typeof (node.theme) == 'string') {
            params.node.theme = node.theme;
        }
        if (typeof (node.meta) == 'string') {
            params.node.meta = node.meta;
        }
        //console.log('put node', params);
        gdb.query("MATCH (u:User)-[:ACT]->(n:Note)-[:ACT]->(u)\n      WHERE id(u) = {user_id} AND id(n) = {node_id} AND n.root_id = {root_id}\n      SET n.updated = timestamp(),\n      n += {node}\n      RETURN n", params, function (err, result) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                console.log('put node', result);
                res.json(result[0]);
            }
        });
    }
    else {
        res.status(400).json({ message: 'invalid data' });
    }
});
app.delete('/api/note/:id', checkToken, function (req, res, next) {
    // soft delete by replacing label? 
    // can't delete root?
    // delete all relations? soft delete by replacing type?
    // need to make sure details have routes to mandala? 
    // auto define details to abstract?
    // set deleted timestamp
    var params = {
        user_id: req.headers.user_id,
        root_id: req.headers.root_id,
        node_id: req.params.id
    };
    if (params.node_id != params.root_id) {
        gdb.query(// get parent with least degree and set degree
        "MATCH (u:User)-[:ROOT]->(r:Note:Root) WHERE id(u) = {user_id} AND id(r) = {root_id}\n      MATCH (u)-[:ACT]->(n:Note)-[:ACT]->(u) WHERE id(n) = {node_id} AND n.root_id = {root_id}\n      OPTIONAL MATCH (n)-[:DEFINE]->(specific:Note)\n      OPTIONAL MATCH (alt_n:Note)-[:DEFINE]->(specific) WHERE id(alt_n) <> id(n) AND alt_n.root_id = {root_id}\n      CASE \n        WHEN (specific && !alt_n)\n        THEN\n          RETURN n\n      END\n      WITH n,\n      MATCH (n)-[r]-()\n      DELETE r\n      SET n.deleted = timestamp()\n      RETURN true", params, function (err, result) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                console.log('delete note', result);
                res.json({ message: 'wait, what note? lol.' });
            }
        });
    }
    else {
        res.status(400).json({ message: 'invalid data' });
    }
});
app.post('/api/relationship', checkToken, function (req, res, next) {
    var relationship = req.body;
    console.log(relationship);
    if (typeof (relationship.start) == 'number' &&
        typeof (relationship.end) == 'number' &&
        typeof (relationship.type) == 'string') {
        var params = {
            user_id: req.headers.user_id,
            root_id: req.headers.root_id,
            start: relationship.start,
            end: relationship.end
        };
        var query = '';
        if (relationship.type == 'DEFINE') {
            query += "MATCH (u:User)-[:ACT]->(n0:Note{root_id: {root_id}})-[:ACT]->(u),\n        (u)-[:ACT]->(n1:Note{root_id: {root_id}})-[:ACT]->(u)\n        WHERE id(u) = {user_id} AND id(n0) = {start} AND id(n1) = {end}\n        MERGE (n0)-[r:DEFINE{root_id: {root_id}}]->(n1)";
        }
        else {
            query += "MATCH (u:User)<-[:ACT]-(n0:Note),\n        (u)<-[:ACT]-(n1:Note)\n        WHERE id(u) = {user_id} AND id(n0) = {start} AND id(n1) = {end}";
            if (relationship.type == 'PRESENT') {
                query += " MERGE (n0)-[r:PRESENT{root_id: {root_id}}]->(n1)";
            }
            else if (relationship.type == 'EQUATE') {
                query += " MERGE (n0)-[r:EQUATE{root_id: {root_id}}]->(n1)";
            }
            else {
                res.status(400).json({ message: 'invalid data' });
            }
        }
        query += " ON MATCH\n        SET r.updated = timestamp()\n        CASE WHEN n0.degree + 1 < n1.degree THEN SET n1.degree = n0.degree + 1 END\n      ON CREATE\n        SET r.created = timestamp()\n      RETURN r";
        gdb.query(query, params, function (err, result) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                console.log('post relation', result);
                res.json(result[0]);
            }
        });
    }
    else {
        res.status(400).json({ message: 'invalid data' });
    }
});
app.delete('/api/relationship/:id', checkToken, function (req, res, next) {
    var params = {
        user_id: req.headers.user_id,
        root_id: req.headers.root_id,
        relationship_id: parseInt(req.params.id),
    };
    gdb.query(// TODO make sure either/both notes is in vision?
    //TODO enable recursive deletes
    // DEFINE relations are only deleted, if an alternate DEFINE path exists from root to target
    "MATCH (n0:Note)-[r{root_id: {root_id}}]->(n1:Note) WHERE id(r) = {relationship_id}\n    OPTIONAL MATCH (alt_n0{root_id: {root_id}})-[alt_r:DEFINE{root_id: {root_id}}]->(n1) WHERE id(alt_r) <> id(r)\n    WITH n0, r, n1,\n      (CASE WHEN type(r) = 'DEFINE' THEN [1] ELSE [] END) AS define, \n      (CASE WHEN type(r) <> 'DEFINE' THEN [1] ELSE [] END) AS non_define, \n      (CASE WHEN (alt_n0 IS NOT NULL AND alt_r IS NOT NULL) THEN [min(alt_n0.degree)] ELSE [] END) AS alt_define\n    FOREACH (is_define IN define |\n      FOREACH (alt_define_degree IN alt_define |\n        SET n1.degree = alt_define_degree + 1\n        DELETE r\n      )\n    )\n    FOREACH (is_not_define IN non_define |\n      DELETE r\n    )\n    RETURN define, alt_define", params, function (err, result) {
        if (err) {
            res.status(500).send(err);
        }
        else {
            console.log('delete relation', result);
            var deleted = true;
            var message = 'wait, what relationship? lol';
            if (result && result[0]) {
                if (result[0].define.length > 0 && !(result[0].alt_define.length > 0)) {
                    deleted = false;
                    message = 'need alternate define relationship';
                }
            }
            else {
                deleted = false;
                message = 'relationship not found';
            }
            res.json({
                deleted: deleted,
                message: message
            });
        }
    });
}); // maybe relations only get deleted? (maybe PUT if there's relation text..?)
app.use(function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});
/*
io.on('connection', (socket) => {
  console.log('a user has connected');
  socket.broadcast.emit('chat message', 'I have arrived!');
  socket.on('chat message', (message) => {
    console.log(message);
    io.emit('chat message', message);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});*/
var server = app.listen(3000, function () {
    console.log('listening on 3000');
});
/*
http.listen(3000, function() {
  console.log('listening on 3000');
});*/
//# sourceMappingURL=server.js.map