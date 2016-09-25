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
app.get('/styles.css', (req, res) => {
  res.sendFile(path.join(__dirname, '/styles.css'));
});
app.get('/systemjs.config.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'systemjs.config.js'));
});

//TODO split into routes

let getToken = (profile, callback) => {
  let payload = {
    created: new Date(),
    username: profile.username,
    user_id: profile.user_id,
    root_id: profile.root_id
  };
  console.log('new token payload', payload);
  jwt.sign(payload, secret, {}, callback);
};
let checkToken = (req, res, next) => {
  jwt.verify(req.headers.token, secret, (err, payload) => {
    if (err) {
      res.status(401).json({message: 'authentication required'});
    } 
    else {
      let t0 = new Date(payload.created);
      let t1 = new Date();
      if (t1 - t0 >= 1000000000) {
        res.status(401).json({message: 'authentication required (token expired)'});
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
app.post('/api/register', (req, res, next) => {
  let signature = req.body;
  if (
    typeof(signature.username) =='string' &&
    typeof(signature.password) == 'string'
  ) {
    gdb.query(
      `MATCH (u:User{username:{username}})
      RETURN u`,
      signature,
      (err, result) => {
        if (err) { res.status(500).send(err); }
        else if (result.length > 0) {
          res.status(402).json({message: 'username unavailable'});
        } 
        else {
          let params = {
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
          gdb.query( // there should exist a bijection from user_ids to root_ids09
            `CREATE (u:User)-[write:ACT]->(n:Note:Root)-[read:ACT]->(u),
            (u)-[root:ROOT]->(n),
            (u)-[frame:FRAME]->(n),
            (u)-[current:CURRENT]->(n)
            SET u.created = timestamp(),
            u += {user},
            n.created = timestamp(),
            n.root_id = id(n),
            n += {note},
            write.created = timestamp(),
            read.created = timestamp(),
            root.created = timestamp(),
            frame.created = timestamp(),
            current.created = timestamp()
            RETURN {
              username: u.username,
              user_id: id(u),
              root_id: id(n)
            }`,
            params,
            (err, result) => {
              if (err) { res.status(500).send(err); }
              else {
                console.log('register', result);
                let profile = result[0];
                getToken(profile, (err, token) => {
                  if (err) { res.status(500).send(err); }
                  else {
                    res.json({
                      token: token,
                      username: profile.username,
                      user_id: profile.user_id,
                      root_id: profile.root_id
                    });
                  }
                });
              }
            });
          // TODO send verification email; setup verification process
        }
      });
  }
  else { res.status(400).json({message:'(username, password) required'}); } 
});
app.post('/api/login', (req, res, next) => {
  let signature = req.body;
  if (
    typeof(signature.username) == 'string' &&
    typeof(signature.password) == 'string'
  ) {
    gdb.query(
      `MATCH (u:User)-[:ROOT]->(n:Note:Root) WHERE u.username = {username}
      RETURN {
        username: u.username,
        user_id: id(u),
        root_id: id(n)
      }`,
      signature,
      (err, result) => {
        //console.log(result);
        if (err) { res.status(500).send(err); }
        else if (result.length == 1) {
          let profile = result[0];
          if (passwordHash.verify(signature.password, profile.hash)) {
            getToken(profile, (err, token) => {
              if (err) { res.status(500).send(err); }
              else { 
                res.json({
                  token: token,
                  username: profile.username,
                  user_id: profile.user_id,
                  root_id: profile.root_id
                });
              }
            });
          }
          else { res.status(401).json({message: '(username, password) invalid'}); }
        }
        else { res.status(401).json({message: '(username, password) invalid'}); }
      });
  }
  else { res.status(400).json({message: '(username, password) required'}); }
});
app.post('/api/verifytoken', checkToken, (req, res, next) => {
  // checkToken should 401 if token invalid?
  console.log('verifytoken');
  res.json({
    token: req.headers.token,
    username: req.headers.username,
    user_id: req.headers.user_id,
    root_id: req.headers.root_id
  });
})

app.get('/api/notation', checkToken, (req, res, next) => {
  let params = {
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
  gdb.query(
    `MATCH (u:User) WHERE id(u) = {user_id}
    MATCH (u)-[:ROOT]->(r:Note:Root) WHERE id(r) = {root_id}
    MATCH (u)-[:FRAME]->(f:Note) WHERE f.root_id = {root_id}
    MATCH (u)-[:CURRENT]->(c:Note)
    MATCH (u)<-[:ACT]-(n:Note)
    OPTIONAL MATCH (n)--(target:Note)
    OPTIONAL MATCH (n)<-[d0:DEFINE]-(target) WHERE d0.root_id = {root_id} AND n.root_id = target.root_id
    OPTIONAL MATCH (n)-[d1:DEFINE]->(target) WHERE d1.root_id = {root_id} AND n.root_id = target.root_id
    OPTIONAL MATCH (n)<-[x_d0:DEFINE]-(target) WHERE x_d0.root_id <> {root_id} AND n.root_id = target.root_id
    OPTIONAL MATCH (n)-[x_d1:DEFINE]->(target) WHERE x_d1.root_id <> {root_id} AND n.root_id = target.root_id
    OPTIONAL MATCH (n)<-[p0:PRESENT]-(target) WHERE p0.root_id = {root_id}
    OPTIONAL MATCH (n)-[p1:PRESENT]->(target) WHERE p1.root_id = {root_id}
    OPTIONAL MATCH (n)<-[x_p0:PRESENT]-(target) WHERE x_p0.root_id <> {root_id}
    OPTIONAL MATCH (n)-[x_p1:PRESENT]->(target) WHERE x_p1.root_id <> {root_id}
    OPTIONAL MATCH (n)<-[e0:EQUATE]-(target) WHERE e0.root_id = {root_id}
    OPTIONAL MATCH (n)-[e1:EQUATE]->(target) WHERE e1.root_id = {root_id}
    OPTIONAL MATCH (n)<-[x_e0:EQUATE]-(target) WHERE x_e0.root_id <> {root_id}
    OPTIONAL MATCH (n)-[x_e1:EQUATE]->(target) WHERE x_e1.root_id <> {root_id}
    WITH u, r, f, c, n, target, d0, d1, p0, p1, e0, e1,
      collect(x_d0) AS x_d0s,
      collect(x_d1) AS x_d1s,
      collect(x_p0) AS x_p0s,
      collect(x_p1) AS x_p1s,
      collect(x_e0) AS x_e0s,
      collect(x_e1) AS x_e1s
    WITH u, r, f, c, n, CASE
      WHEN target IS NOT NULL
      THEN collect({
        source_id: id(n),
        target_id: id(target),
        define: {
          in: d0,
          extra_ins: x_d0s,
          out: d1,
          extra_outs: x_d1s
        },
        present: {
          in: p0,
          extra_ins: x_p0s,
          out: p1,
          extra_outs: x_p1s
        },
        equate: {
          in: e0,
          extra_ins: x_e0s,
          out: e1,
          extra_outs: x_e1s
        }
      })
      ELSE [] END AS relations
    RETURN {
      settings: {
        root_id: id(r),
        frame_id: id(f),
        current_id: id(c),
        username: u.username,
        user_id: id(u),
        email: u.email,
        width: u.width,
        height: u.height,
        gravity: u.gravity,
        friction: u.friction,
        linkDistance: u.linkDistance,
        linkStrength: u.linkStrength,
        charge: u.charge,
        theta: u.theta,
        alpha: u.alpha,
        textHeight: u.textHeight
      },
      notes: collect({
        node: n,
        relations: relations
      })
    }`,
    params,
    (err, result) => {
      if (err) { res.status(500).send(err); }
      else {
        console.log('get notation', result);
        res.json(result[0]);
      }
    });
});
app.post('/api/selection', checkToken, (req, res, next) => {
  // TODO collapse specific tree, TODO remove extra_note from view
  let update = req.body;
  console.log(update);

  if (update.frame || update.current) {
    let params = {
      user_id: req.headers.user_id,
      root_id: req.headers.root_id,
      node_id: update.target_id,
      x: update.x,
      y: update.y,
      z: update.z
    };
    let query = '';
    if (update.frame) {
      query += `MATCH (u:User)-[:ACT]->(n1:Note)-[:ACT]->(u) 
        WHERE id(u) = {user_id} AND id(n1) = {node_id} and n1.root_id = {root_id}
        MATCH (u)-[f0:FRAME]->(n0:Note)
        SET n0.framed = n0.framed + timestamp() - f0.created,
        DELETE f0
        CREATE (u)-[f1:FRAME]->(n1)
        SET f1.created = timestamp(),
        n1.x = {x},
        n1.y = {y},
        n1.z = {z}`;
      if (update.current) {
        query += ` WITH u, n1, f1
        MATCH (u)-[c0:CURRENT]->(n0:Note)  
        FOREACH(n0_is_endo IN CASE WHEN n0.root_id = {root_id} THEN [1] ELSE [] END |
          SET n0.currented = n0.currented + timestamp() - c0.created
        )
        FOREACH(n0_is_extra IN CASE WHEN n0.root_id <> {root_id} THEN [1] ELSE [] END |
          SET n0.x_currented = n0.x_currented + timestamp() - c0.created
        )
        DELETE c0
        CREATE (u)-[c1:CURRENT]->(n1)
        SET c1.created = timestamp()
        RETURN n1, f1, c1`;
      }
      else {
        query += ' RETURN n1, f1'
      }
    }
    else if (update.current) {
      query += `MATCH (u:User)<-[:ACT]-(n1:Note)
        WHERE id(u) = {user_id} AND id(n1) = {node_id}
        MATCH (u)-[c0:CURRENT]->(n0:Note)
        FOREACH(n0_is_cis IN CASE WHEN n0.root_id = {root_id} THEN [1] ELSE [] END |
          SET n0.currented = n0.currented + timestamp() - c0.created
        )
        FOREACH(n0_is_extra IN CASE WHEN n0.root_id <> {root_id} THEN [1] ELSE [] END |
          SET n0.x_currented = n0.x_currented + timestamp() - c0.created
        )
        DELETE c0
        CREATE (u)-[c1:CURRENT]->(n1)
        SET c1.created = timestamp(),
        n1.x = {x},
        n1.y = {y},
        n1.z = {z}
        RETURN n1, c1`;
    }
    gdb.query(
      query,
      params,
      (err, result) => {
        if (err) { res.status(500).send(err); }
        else {
          console.log('select', result);
          res.json(result[0]);
        }
      });
  }
  else {
    res.status(400).json({message: 'invalid data'});
  }
});
// TODO add nexus notes; include fun facts in the demo
app.post('/api/note', checkToken, (req, res, next) => {
  // (nodes are posted with just coordinates; text is updated in subsequent puts)
  let note = req.body;
  if (
    typeof(note.x) == 'number' &&
    typeof(note.y) == 'number' &&
    typeof(note.z) == 'number' &&
    typeof(note.fixed) == 'boolean' &&
    typeof(note.secret) == 'boolean' &&
    typeof(note.showMeasurement) == 'boolean' &&
    typeof(note.showParagraph) == 'boolean' &&
    typeof(note.showDefinitions) == 'boolean' &&
    typeof(note.showPresentations) == 'boolean' &&
    typeof(note.showEquations) == 'boolean' &&
    typeof(note.present) == 'boolean' &&
    typeof(note.equate) == 'boolean'
  ) {
    let params = { // don't use the req.body directly, to prevent sneaky shit from getting in there
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
    let query = `MATCH (u:User)-[:FRAME]->(frame:Note)
      WHERE id(u) = {user_id}`;
    if (note.present || note.equate)  {
      query += `MATCH (u)-[:CURRENT]->(current:Note)`
    }

    query += `CREATE (u)-[write:ACT]->(n:Note)-[read:ACT]->(u),
      (frame)-[d:DEFINE]->(n)`;
    if (note.present) {
      query += `, (current)-[p:PRESENT]->(n)`;
    }
    if (note.equate) {
      query += `, (current)-[e:EQUATE]->(n)`;
    }

    query += ` SET n.created = timestamp(),
      n.root_id = {root_id},
      n.degree = frame.degree + 1,
      n += {node},
      write.created = timestamp(),
      read.created = timestamp(),
      d.created = timestamp(),
      d.root_id = {root_id}`;
    if (note.present) {
      query += `, p.created = timestamp(), p.root_id = {root_id}`;
    }
    if (note.equate) {
      query += `, e.created = timestamp(), e.root_id = {root_id}`;
    }
    // run a match to coalesce relations, in case frame and current are the same note
    query += ` WITH n
      MATCH (n)--(target:Note)
      OPTIONAL MATCH (n)<-[d0:DEFINE]-(target)
      OPTIONAL MATCH (n)<-[p0:PRESENT]-(target)
      OPTIONAL MATCH (n)<-[e0:EQUATE]-(target)
      WITH n, collect({
        source_id: id(n),
        target_id: id(target),
        define: {
          in: d0
        },
        present: {
          in: p0
        },
        equate: {
          in: e0
        }
      }) AS relations
      RETURN {
        node: n,
        relations: relations
      }`;
    gdb.query(
      query,
      params,
      (err, result) => {
        if (err) { console.error(err); res.status(500).send(err); }
        else {
          console.log('post note',result);
          res.json(result[0]);
        }
      });
  } 
  else {
    console.error('invalid post note', note);
    res.status(400).json({message: 'invalid data'});
  }
});
app.put('/api/node/:id', checkToken, (req, res, next) => {
  let node = req.body;
  console.log('put node', node);
  if (
    typeof(node.secret) == 'boolean' &&
    typeof(node.x) == 'number' &&
    typeof(node.y) == 'number' &&
    typeof(node.z) == 'number' &&
    typeof(node.fixed) == 'boolean' && 
    typeof(node.showMeasurement) == 'boolean' &&
    typeof(node.showParagraph) == 'boolean' &&
    typeof(node.showDefinitions) == 'boolean' &&
    typeof(node.showPresentations) == 'boolean' &&
    typeof(node.showEquations) == 'boolean'
  ) { 
    let params = {
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
    if (typeof(node.name) == 'string') { // (option to update position w/o updating text)
      params.node.name = node.name;
    }
    if (typeof(node.theme) == 'string') { // (option to update position w/o updating text)
      params.node.theme = node.theme;
    }
    if (typeof(node.meta) == 'string') { // (option to update position w/o updating text)
      params.node.meta = node.meta;
    }
    //console.log('put node', params);
    gdb.query(
      `MATCH (u:User)-[:ACT]->(n:Note)-[:ACT]->(u)
      WHERE id(u) = {user_id} AND id(n) = {node_id} AND n.root_id = {root_id}
      SET n.updated = timestamp(),
      n += {node}
      RETURN n`,
      params,
      (err, result) => {
        if (err) { res.status(500).send(err); }
        else {
          console.log('put node', result);
          res.json(result[0]);
        }
      });
  }
  else {
    res.status(400).json({message: 'invalid data'});
  }
});
app.delete('/api/note/:id', checkToken, (req, res, next) => {
  // soft delete by replacing label? 
  // can't delete root?
  // delete all relations? soft delete by replacing type?
  // need to make sure details have routes to mandala? 
  // auto define details to abstract?
  // set deleted timestamp
  let params = {
    user_id: req.headers.user_id,
    root_id: req.headers.root_id,
    node_id: req.params.id
  };
  if (params.node_id != params.root_id) {
    gdb.query( // get parent with least degree and set degree
      `MATCH (u:User)-[:ROOT]->(r:Note:Root) WHERE id(u) = {user_id} AND id(r) = {root_id}
      MATCH (u)-[:ACT]->(n:Note)-[:ACT]->(u) WHERE id(n) = {node_id} AND n.root_id = {root_id}
      OPTIONAL MATCH (n)-[:DEFINE]->(specific:Note)
      OPTIONAL MATCH (alt_n:Note)-[:DEFINE]->(specific) WHERE id(alt_n) <> id(n) AND alt_n.root_id = {root_id}
      CASE 
        WHEN (specific && !alt_n)
        THEN
          RETURN n
      END
      WITH n,
      MATCH (n)-[r]-()
      DELETE r
      SET n.deleted = timestamp()
      RETURN true`,
      params,
      (err, result) => {
        if (err) { res.status(500).send(err); }
        else {
          console.log('delete note',result);
          res.json({message:'wait, what note? lol.'})
        }
      });
  }
  else {
    res.status(400).json({message: 'invalid data'});
  }
});
app.post('/api/relationship', checkToken, (req, res, next) => {
  let relationship = req.body;
  console.log(relationship);
  if (
    typeof(relationship.start) == 'number' &&
    typeof(relationship.end) == 'number' &&
    typeof(relationship.type) == 'string')
  {
    let params = {
      user_id: req.headers.user_id,
      root_id: req.headers.root_id,
      start: relationship.start,
      end: relationship.end
      // text: relationship.text
      // index: relationship.index
    };
    let query = '';
    if (relationship.type == 'DEFINE') { // note to included note
      query += `MATCH (u:User)-[:ACT]->(n0:Note{root_id: {root_id}})-[:ACT]->(u),
        (u)-[:ACT]->(n1:Note{root_id: {root_id}})-[:ACT]->(u)
        WHERE id(u) = {user_id} AND id(n0) = {start} AND id(n1) = {end}
        MERGE (n0)-[r:DEFINE{root_id: {root_id}}]->(n1)`;
    }
    else { 
      query += `MATCH (u:User)<-[:ACT]-(n0:Note),
        (u)<-[:ACT]-(n1:Note)
        WHERE id(u) = {user_id} AND id(n0) = {start} AND id(n1) = {end}`;

      if (relationship.type == 'PRESENT') { // note to contiguous note
        query += ` MERGE (n0)-[r:PRESENT{root_id: {root_id}}]->(n1)`;
        // OK if neither note belongs to you?
      }
      else if (relationship.type == 'EQUATE') { // note to identical note
        query += ` MERGE (n0)-[r:EQUATE{root_id: {root_id}}]->(n1)`;
      }
      else {
        res.status(400).json({message: 'invalid data'});
      }
    }
    query += ` ON MATCH
        SET r.updated = timestamp()
        CASE WHEN n0.degree + 1 < n1.degree THEN SET n1.degree = n0.degree + 1 END
      ON CREATE
        SET r.created = timestamp()
      RETURN r`;
    gdb.query(
      query,
      params,
      (err, result) => {
        if (err) { res.status(500).send(err); }
        else {
          console.log('post relation',result);
          res.json(result[0]);
        }
      });
  }
  else {
    res.status(400).json({message: 'invalid data'});
  }
});
app.delete('/api/relationship/:id', checkToken, (req, res, next) => {
  let params = {
    user_id: req.headers.user_id,
    root_id: req.headers.root_id,
    relationship_id: parseInt(req.params.id),
  };
  gdb.query( // TODO make sure either/both notes is in vision?
    //TODO enable recursive deletes
    // DEFINE relations are only deleted, if an alternate DEFINE path exists from root to target
    `MATCH (n0:Note)-[r{root_id: {root_id}}]->(n1:Note) WHERE id(r) = {relationship_id}
    OPTIONAL MATCH (alt_n0{root_id: {root_id}})-[alt_r:DEFINE{root_id: {root_id}}]->(n1) WHERE id(alt_r) <> id(r)
    WITH n0, r, n1,
      (CASE WHEN type(r) = 'DEFINE' THEN [1] ELSE [] END) AS define, 
      (CASE WHEN type(r) <> 'DEFINE' THEN [1] ELSE [] END) AS non_define, 
      (CASE WHEN (alt_n0 IS NOT NULL AND alt_r IS NOT NULL) THEN [min(alt_n0.degree)] ELSE [] END) AS alt_define
    FOREACH (is_define IN define |
      FOREACH (alt_define_degree IN alt_define |
        SET n1.degree = alt_define_degree + 1
        DELETE r
      )
    )
    FOREACH (is_not_define IN non_define |
      DELETE r
    )
    RETURN define, alt_define`,
    params,
    (err, result) => {
      if (err) { res.status(500).send(err); }
      else {
        console.log('delete relation', result);
        let deleted = true;
        let message = 'wait, what relationship? lol'; 
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

app.use((req, res) => {
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

var server = app.listen(3000, () => {
  console.log('listening on 3000');
});
/*
http.listen(3000, function() {
  console.log('listening on 3000');
});*/
