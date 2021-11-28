var joints, candidates, items, cloneChoice, rightAnswer, rightDrag, episodes, end1, end2,
  currentEpisode = 0, sureSprite, childIndexGlobal, moveShape,
  currentDragTime = {}, isClickEvent = false, enterType = {}, idleType = {},
  dragdropTip = {
    container: null,
    count: 5,
    tipEvent: null,
    oneToMore: false
  };
var world = null, hangers, isMouseDown, mouseX, mouseY, mouseJoint;
var worldScale = 30, ropeWidth = 10;
// var destroy_list = [];
var score = 0;
var isReady, desBody

window.currentEpisode = 0
window.subNarrations = []
window.prep_quizmopendant = prep_quizmopendant
window.begin_quizmopendant = begin_quizmopendant
window.narrDone_quizmopendant = narrDone_quizmopendant
window.end_quizmopendant = end_quizmopendant

var b2Vec2 = Box2D.Common.Math.b2Vec2,
  b2AABB = Box2D.Collision.b2AABB,
  b2BodyDef = Box2D.Dynamics.b2BodyDef,
  b2Body = Box2D.Dynamics.b2Body,
  b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
  b2Fixture = Box2D.Dynamics.b2Fixture,
  b2World = Box2D.Dynamics.b2World,
  b2MassData = Box2D.Collision.Shapes.b2MassData,
  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
  b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
  b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef,
  b2FilterData = Box2D.Dynamics.b2FilterData, //碰撞过滤数据
  b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef,
  b2ContactListener = Box2D.Dynamics.b2ContactListener,
  b2WeldJointDef = Box2D.Dynamics.Joints.b2WeldJointDef
var bitmapAll;

function prep_quizmopendant(transition) {
  createjs.Ticker.addEventListener('tick', tick)
  createjs.Ticker.setFPS(30)
  createjs.Ticker.useRAF = true
  createjs.Touch.enable(stage, true, false)

  end_world = (function () {
    end_quizmopendant(tick);
  });

  world_current = worlds[pagenames[currentPage]];

  //if game, visible = false. if storybook, visible = true
  arrowbgLeft.visible = false;
  arrowbgRight.visible = false;

  _quizActive = false;
  isCorrect = false;
  rightAnswer = 0;
  subNarrations = [];
  currentEpisode = 0;
  episodes = quiz_content[qWord]["episodes"];
  for (var i = 0; i < episodes.length; i++) {
    subNarrations.push(episodes[i].sound);
  }

  initTransitionAndLoad(transition, begin_quizmopendant);

  // 清除闲置动画
  if (currentEpisode != 0) removeRemindAnimation();
  removeUserHandleEvent();
  enterType = {};
  idleType = {};
  actionArr = [];

  world_current.removeAllChildren();
  sureSprite = null;

  backgroundTemp = quiz_content[qWord]["background1"];
  backgroundImage = images[backgroundTemp["id"]];
  var background1 = new createjs.Bitmap(backgroundImage);
  background1.scaleX = stage.canvas.width / backgroundImage.width;
  background1.scaleY = stage.canvas.height / backgroundImage.height;
  world_current.addChildAt(background1, 0);

  backgroundTemp = quiz_content[qWord]["background2"];
  backgroundImage = images[backgroundTemp["id"]];
  var background2 = new createjs.Bitmap(backgroundImage);
  background2.scaleX = background1.scaleX;
  background2.scaleY = background1.scaleY;
  world_current.addChildAt(background2, 0);

  bitmapAll = new createjs.Bitmap(images["pendant-all"]);

  var bear = new PendantBear();
  world_current.addChild(bear);

  var cloudNum = Math.floor(Math.random() * 3) + 1;
  var direction = Math.random() > 0.5 ? 1 : -1;
  for (var cloudIdx = 0; cloudIdx < cloudNum; cloudIdx++) {
    var cloud = new PendantCloud(direction);
    cloud.x = Math.floor(Math.random() * stage.canvas.width);
    cloud.y = Math.floor(Math.random() * stage.canvas.width / 3);
    world_current.addChild(cloud);
  }

  world = new b2World(
    new b2Vec2(0, 1), //gravity
    true //allow sleep
  )

  var episodeConf = quiz_content[qWord]["episodes"][0];

  pendant_init(episodeConf);

  //碰撞到障碍物，清除，计分
  var contactListener = new b2ContactListener()
  contactListener.PostSolve = function (e) {
    //console.log(e)
    var aBody = e.GetFixtureA().GetBody();
    var bBody = e.GetFixtureB().GetBody();
    var aType = aBody.GetUserData();
    var bType = bBody.GetUserData();
    if (aType != null || bType != null) {
      if (bBody.m_fixtureList.m_filter.groupIndex == 1 && aBody.m_fixtureList.m_filter.groupIndex == 1) {
        isReady = true;
        desBody = aBody;
        world_current.removeChild(aType);
        aBody.userData = null;
        score += 1;
      } else if (aBody.m_fixtureList.m_filter.groupIndex == 2 && bBody.m_fixtureList.m_filter.groupIndex == 1) {
        isReady = true;
        desBody = aBody;
        world_current.removeChild(aType);
        aBody.userData = null;
        addExit(rightDrag);
      }
    }
  }
  world.SetContactListener(contactListener)

  /*
  //setup debug draw
  var debugDraw = new b2DebugDraw()
  debugDraw.SetSprite(document.getElementById('debugCanvas').getContext('2d'))
  debugDraw.SetDrawScale(30.0)
  debugDraw.SetFillAlpha(0.5)
  debugDraw.SetLineThickness(1.0)
  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit)
  world.SetDebugDraw(debugDraw)
  */

  function getBodyAtMouse() {
    mousePVec = new b2Vec2(mouseX, mouseY)
    var aabb = new b2AABB()
    aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001)
    aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001)
    selectedBody = null
    world.QueryAABB(getBodyCB, aabb)
    return selectedBody
  }

  function getBodyCB(fixture) {
    // console.log(fixture.GetBody().GetType())
    if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
      if (
        fixture
          .GetShape()
          .TestPoint(fixture.GetBody().GetTransform(), mousePVec)
      ) {
        selectedBody = fixture.GetBody()
        return false
      }
    }
    return true
  }

  //update
  function update() {
    if (isMouseDown && !mouseJoint) {
      var body = getBodyAtMouse()
      if (body) {
        var md = new b2MouseJointDef() //鼠标连接
        md.bodyA = world.GetGroundBody() //设置鼠标关节的一个节点为空刚体，GetGroundBody()可以理解为空刚体
        md.bodyB = body //设置鼠标关节的另一个刚体为鼠标点击的刚体
        md.target.Set(mouseX, mouseY) //更新鼠标关节拖动的点
        md.collideConnected = true //碰撞连接
        md.maxForce = 300.0 * body.GetMass() //设置鼠标可以施加的最大的力
        mouseJoint = world.CreateJoint(md)
        body.SetAwake(true)
      }
    }
    if (mouseJoint) {
      if (isMouseDown) {
        //如果有鼠标关节存在，更新鼠标关节的拖动点
        mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY))
      } else {
        world.DestroyJoint(mouseJoint) //删除鼠标关节
        mouseJoint = null
      }
    }
    //world.DrawDebugData();
    world.ClearForces();
  }

  //helpers

  function getElementPosition(element) {
    var elem = element,
      tagname = '',
      x = 0,
      y = 0

    while (
      typeof elem == 'object' &&
      typeof elem.tagName != 'undefined'
    ) {
      y += elem.offsetTop
      x += elem.offsetLeft
      tagname = elem.tagName.toUpperCase()

      if (tagname == 'BODY') elem = 0

      if (typeof elem == 'object') {
        if (typeof elem.offsetParent == 'object') elem = elem.offsetParent
      }
    }
    return { x: x, y: y }
  }

  function tick() {
    //stage.update()
    if (!world) return;
    update();
    // 物理演算
    world.Step(1 / 30, 10, 10)

    // 把Box2D的计算结果反映在画上
    var body = world.GetBodyList()
    while (body) {
      var obj = body.GetUserData()
      if (obj) {
        var position = body.GetPosition()
        //var position = body.GetWorldCenter()
        obj.x = position.x * worldScale
        obj.y = position.y * worldScale
        obj.rotation = (body.GetAngle() * 180) / Math.PI
      }
      body = body.GetNext()
    }
    // 画面描写
  }
}

function pendant_init(conf) {
  isMouseDown = false;
  mouseJoint = null;
  if (joints) {
    for (var jointIdx = 0; jointIdx < joints.length; jointIdx++) {
      if (joints[jointIdx]) world.DestroyJoint(joints[jointIdx]);
    }
  }
  var body = world.GetBodyList();
  while (body) {
    world.DestroyBody(body);
    body = body.GetNext();
  }
  joints = [];
  items = [];
  candidates = {};
  hangers = [];

  var episodeContainer = world_current.getChildByName("episodeContainer");
  if (episodeContainer) world_current.removeChild(episodeContainer);

  episodeContainer = new createjs.Container();
  episodeContainer.name = "episodeContainer";
  world_current.addChild(episodeContainer);

  var groundBodyDef = new b2BodyDef();
  groundBodyDef.position.Set(0, (stage.canvas.height - 100) / worldScale);
  groundBodyDef.type = b2Body.b2_staticBody;
  var groundFixtureDef = new b2FixtureDef();
  var groundShape = new b2PolygonShape(0.2);
  groundShape.SetAsBox(stage.canvas.width / worldScale, 0.1);
  groundFixtureDef.shape = groundShape;
  var ground = world.CreateBody(groundBodyDef);
  ground.CreateFixture(groundFixtureDef);

  groundBodyDef.position.Set(0, 0);
  var ceiling = world.CreateBody(groundBodyDef);
  ceiling.CreateFixture(groundFixtureDef);

  var wallBodyDef = new b2BodyDef();
  wallBodyDef.position.Set(0, stage.canvas.height / 2 / worldScale);
  wallBodyDef.type = b2Body.b2_staticBody;
  var wallFixtureDef = new b2FixtureDef();
  var wallShape = new b2PolygonShape(0.2);
  wallShape.SetAsBox(0.1, stage.canvas.height / 2 / worldScale);
  wallFixtureDef.shape = wallShape;
  var leftWall = world.CreateBody(wallBodyDef);
  leftWall.CreateFixture(wallFixtureDef);

  wallBodyDef.position.Set(stage.canvas.width / worldScale, stage.canvas.height / 2 / worldScale);
  var rightWall = world.CreateBody(wallBodyDef);
  rightWall.CreateFixture(wallFixtureDef);

  // slots
  var numOfSlots = conf["items"].length;
  var hangerBodyDef = new b2BodyDef();
  hangerBodyDef.position.Set(0, 0);
  hangerBodyDef.type = b2Body.b2_dynamicBody;
  var hangerFixtureDef = new b2FixtureDef();
  var hangerShape = new b2PolygonShape(0.2);
  hangerShape.SetAsBox(0.1, 0.2);
  hangerFixtureDef.shape = hangerShape;
  hangerFixtureDef.density = 0.1;
  var hangerImg1 = bitmapAll.clone();
  var hangerImg2 = bitmapAll.clone();
  var hangerImg3 = bitmapAll.clone();
  var rect = bitmapAreas["pendant-hanger1"];
  hangerImg1.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3])
  rect = bitmapAreas["pendant-hanger2"];
  hangerImg2.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3])
  hangerImg2.rect = rect;
  rect = bitmapAreas["pendant-hanger3"];
  hangerImg3.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3])
  hangerImg3.rect = rect;
  var itemConf = conf["items"];

  // init two ends
  var bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_staticBody;
  var fixtureDef = new b2FixtureDef();
  circleShape = new b2CircleShape(0.1);
  fixtureDef.shape = circleShape;
  bodyDef.position.x = conf["rope"]["startX"] / worldScale; //x轴
  bodyDef.position.y = conf["rope"]["y"] / worldScale; //y轴
  end1 = world.CreateBody(bodyDef);
  bodyDef.position.x = conf["rope"]["endX"] / worldScale; //x轴
  bodyDef.position.y = conf["rope"]["y"] / worldScale; //y轴
  end2 = world.CreateBody(bodyDef);
  end1.CreateFixture(fixtureDef);
  end2.CreateFixture(fixtureDef);

  // rope image
  var ropeImg = new createjs.Bitmap(images[conf["rope"].id]);
  ropeImg.scaleX = ropeImg.scaleY = (ropeWidth - 2) / ropeImg.image.height;
  var ropeLength = ropeImg.image.width * ropeImg.scaleX - 3; //* ropeWidth / ropeImg.image.height * ropeImg.scaleX;
  ropeImg.regX = ropeImg.image.width / 2;
  ropeImg.regY = ropeImg.image.height / 2;
  var polygonShape = new b2PolygonShape();
  polygonShape.SetAsBox(ropeLength / worldScale / 2, ropeWidth / worldScale / 2);
  // link fixture;
  fixtureDef.density = 10;
  fixtureDef.friction = 0;
  fixtureDef.restitution = 0.0;// 弹性（0~1）
  fixtureDef.shape = polygonShape;
  // link body
  bodyDef.type = b2Body.b2_dynamicBody;
  var segment, newSegment, totalLength = 0;
  // link creation
  var i = 0;
  var targetLength = (parseInt(conf["rope"]["endX"]) - parseInt(conf["rope"]["startX"])) * 1.0;
  var hangerDistance = targetLength / (numOfSlots + 1);
  var currentHangerIdx = 1;
  while (true) {
    totalLength += ropeLength;
    if (i == 0) {
      var bmp = ropeImg.clone();
      bodyDef.userData = bmp;
      // 定位中心点
      bodyDef.position.Set((parseInt(conf["rope"]["startX"]) + ropeLength / 2) / worldScale, parseInt(conf["rope"]["y"]) / worldScale);
      segment = world.CreateBody(bodyDef);
      segment.CreateFixture(fixtureDef);
      joints.push(revoluteJoint(segment, end1, new b2Vec2(-ropeLength / worldScale / 2, 0), new b2Vec2(0, 0)));
      bmp.x = bodyDef.position.x * worldScale;
      bmp.y = bodyDef.position.y * worldScale;
      episodeContainer.addChildAt(bmp, 0);
      if (totalLength / hangerDistance > currentHangerIdx) {
        var hangerBmp;
        if (itemConf[currentHangerIdx - 1].status == "on") {
          hangerBmp = hangerImg1.clone();
          hangerBmp.scaleX = hangerBmp.scaleY = 0.6;
          hangerBmp.regX = hangerBmp.getBounds().width / 2;
          hangerBmp.regY = hangerBmp.getBounds().height / 2;
          hangerBmp.index = currentHangerIdx - 1;
          hangerBmp.available = false;
          var item = {};
          item["label"] = itemConf[currentHangerIdx - 1].label;
          item["index"] = currentHangerIdx;
          item["status"] = "on";
          item["currentLabel"] = itemConf[currentHangerIdx - 1].label;
          items.push(item);
        } else {
          hangerBmp = hangerImg2.clone();
          hangerBmp.scaleX = hangerBmp.scaleY = 0.6;
          hangerBmp.regX = hangerBmp.getBounds().width / 2;
          hangerBmp.regY = hangerBmp.getBounds().height / 2;
          hangerBmp.focus = hangerImg3.rect;
          hangerBmp.unfocus = hangerImg2.rect;
          hangerBmp.scaleX = hangerBmp.scaleY = 0.6;
          hangerBmp.index = currentHangerIdx - 1;
          hangerBmp.available = true;
          item["label"] = itemConf[currentHangerIdx - 1].label;
          item["currentLabel"] = -1;
          item["index"] = currentHangerIdx;
          item["status"] = "off";
          items.push(item);
        }
        episodeContainer.addChild(hangerBmp);
        hangerBodyDef.userData = hangerBmp;
        var hanger = world.CreateBody(hangerBodyDef);
        hanger.CreateFixture(hangerFixtureDef);
        hangerBmp.body = hanger;
        var pos = hangerDistance * currentHangerIdx - (totalLength - ropeLength / 2);
        joints.push(weldJoint(hanger, segment, new b2Vec2(0, -0.1), new b2Vec2(pos / worldScale, 0)));
        hangers.push(hangerBmp);
        currentHangerIdx++;
      }
    } else if (totalLength > targetLength) {
      // 定位中心点
      bodyDef.position.Set((parseInt(conf["rope"]["endX"]) - ropeLength / 2) / worldScale, parseInt(conf["rope"]["y"]) / worldScale);
      var bmp = ropeImg.clone();
      bodyDef.userData = bmp;
      newSegment = world.CreateBody(bodyDef);
      newSegment.CreateFixture(fixtureDef);
      joints.push(revoluteJoint(segment, newSegment, new b2Vec2(ropeLength / worldScale / 2, 0), new b2Vec2(-ropeLength / worldScale / 2, 0)));
      joints.push(revoluteJoint(newSegment, end2, new b2Vec2(ropeLength / worldScale / 2, 0), new b2Vec2(0, 0)));
      bmp.x = bodyDef.position.x * worldScale;
      bmp.y = bodyDef.position.y * worldScale;
      episodeContainer.addChildAt(bmp, 0);
      break;
    } else {
      var x = end1.GetPosition().x + (totalLength - ropeLength / 2) / worldScale;
      bodyDef.position.Set(x, parseInt(conf["rope"]["y"]) / worldScale);
      var bmp = ropeImg.clone();
      bodyDef.userData = bmp;
      newSegment = world.CreateBody(bodyDef);
      newSegment.CreateFixture(fixtureDef);
      revoluteJoint(segment, newSegment, new b2Vec2(ropeLength / worldScale / 2, 0), new b2Vec2(-ropeLength / worldScale / 2, 0));
      segment = newSegment;
      bmp.x = bodyDef.position.x * worldScale;
      bmp.y = bodyDef.position.y * worldScale;
      episodeContainer.addChildAt(bmp, 0);
      if (totalLength / hangerDistance > currentHangerIdx) {
        var hangerBmp;
        var hangerJointDistance = 0.1;
        if (itemConf[currentHangerIdx - 1].status == "on") {
          hangerBmp = hangerImg1.clone();
          hangerBmp.scaleX = hangerBmp.scaleY = 0.6;
          hangerBmp.regX = hangerBmp.getBounds().width / 2;
          hangerBmp.regY = hangerBmp.getBounds().height / 2;
          hangerBmp.available = false;
          hangerBmp.index = currentHangerIdx - 1;
          var item = {};
          item["label"] = itemConf[currentHangerIdx - 1].label;
          item["index"] = currentHangerIdx;
          item["status"] = "on";
          item["currentLabel"] = itemConf[currentHangerIdx - 1].label;
          items.push(item);
        } else {
          hangerBmp = hangerImg2.clone();
          hangerBmp.scaleX = hangerBmp.scaleY = 0.6;
          hangerBmp.regX = hangerBmp.getBounds().width / 2;
          hangerBmp.regY = hangerBmp.getBounds().height / 2;
          hangerBmp.focus = hangerImg3.rect;
          hangerBmp.unfocus = hangerImg2.rect;
          hangerBmp.index = currentHangerIdx - 1;
          hangerBmp.available = true;
          var item = {};
          item["label"] = itemConf[currentHangerIdx - 1].label;
          item["index"] = currentHangerIdx;
          item["status"] = "off";
          item["currentLabel"] = -1;
          items.push(item);
          hangerJointDistance = -0.1;
        }
        episodeContainer.addChild(hangerBmp);
        hangerBodyDef.userData = hangerBmp;
        var hanger = world.CreateBody(hangerBodyDef);
        hanger.CreateFixture(hangerFixtureDef);
        hangerBmp.body = hanger;
        var pos = hangerDistance * currentHangerIdx - (totalLength - ropeLength / 2);
        joints.push(weldJoint(hanger, segment, new b2Vec2(0, -0.1), new b2Vec2(pos / worldScale, 0)));
        hangers.push(hangerBmp);
        currentHangerIdx++;
      }
    }
    i++;
  }


  // candidate
  var candidateConf = conf["candidates"];
  var candidateBodyDef = new b2BodyDef();
  candidateBodyDef.position.Set(stage.canvas.width / 2 / worldScale, (stage.canvas.height - 100) / 2 / worldScale);
  candidateBodyDef.type = b2Body.b2_dynamicBody;
  var candidateFixtureDef = new b2FixtureDef();
  for (var candidateIdx = 0; candidateIdx < candidateConf.length; candidateIdx++) {
    var container = new createjs.Container();
    var baloon = bitmapAll.clone();
    var rect = bitmapAreas[candidateConf[candidateIdx].key];
    baloon.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3])
    baloon.regX = baloon.getBounds().width / 2;
    baloon.regY = baloon.getBounds().height / 2;
    container.addChild(baloon);
    container.label = candidateConf[candidateIdx].label;
    if (candidateConf[candidateIdx].number != undefined && candidateConf[candidateIdx].number >= 0) {
      var text = new createjs.Text(candidateConf[candidateIdx].number, '32px Arial', '#593775')
      text.x = -text.getMeasuredWidth() / 2;
      text.y = -text.getMeasuredHeight() / 2;
      container.addChild(text);
    }
    episodeContainer.addChild(container);
    candidateBodyDef.userData = container;
    var candidateShape = new b2CircleShape(baloon.getBounds().width / worldScale / 2);
    candidateFixtureDef.density = 0.01;
    candidateFixtureDef.shape = candidateShape;
    var candidate = world.CreateBody(candidateBodyDef);
    candidate.CreateFixture(candidateFixtureDef);
    container.body = candidate;
    candidates[container.label] = container;
  }

  var itemIdx = 0;
  setTimeout(animate, 1000);

  var candidateFruits = [];

  function animate() {
    if (itemIdx < items.length) {
      if (items[itemIdx].status == "off") {
        var label = items[itemIdx].label;
        candidates[label].on("mousedown", dragBegin);
        candidates[label].on("pressmove", drag);
        candidates[label].on("pressup", dragEnd);
        candidateFruits.push(candidates[label]);
        itemIdx++;
        animate();
        return;
      }
      var item = candidates[items[itemIdx].label];
      //item.x = candidates[items[itemIdx].label].x + panel.x;
      //item.y = candidates[items[itemIdx].label].y + panel.y;
      item.index = itemIdx;
      episodeContainer.addChild(item);
      createjs.Tween.get(item)
        .to({ "x": hangers[itemIdx].body.GetPosition().x * worldScale, "y": hangers[itemIdx].body.GetPosition().y * worldScale }, 800)
        .call(function () {
          var index = this.index;
          joints.push(revoluteJoint(hangers[index].body, this.body, new b2Vec2(0, 0.5), new b2Vec2(0, -this.getBounds().width * this.scaleX / worldScale / 2)));
          itemIdx++;
          animate();
        });
    } else {
      Touch.enable(candidateFruits);
      return;
    }
  }

  function dragBegin(evt) {
    isMouseDown = true;
    mouseX = evt.stageX / worldScale;
    mouseY = evt.stageY / worldScale;
    if (this.status == "on") {
      this.parent.setChildIndex(this, this.parent.children.length - 1);
      this.status = "off";
      items[this.hanger.index].currentLabel = -1;
      items[this.hanger.index].status = "off";
      this.hanger.item = null;
      this.hanger = null;
      world.DestroyJoint(this.joint);
      this.joint = null;
    }
  }

  function drag(evt) {
    mouseX = evt.stageX / worldScale;
    mouseY = evt.stageY / worldScale;
    for (var hangerIdx = 0; hangerIdx < hangers.length; hangerIdx++) {
      var hanger = hangers[hangerIdx];
      if (!hanger.available) continue;
      if (distance(hanger, { "x": evt.stageX, "y": evt.stageY }) < 80 && hanger.focusStatus == false) {
        hanger.sourceRect = new createjs.Rectangle(hanger.focus[0], hanger.focus[1], hanger.focus[2], hanger.focus[3]);
        hanger.focusStatus = true;
      } else if (hanger.focusStatus) {
        hanger.sourceRect = new createjs.Rectangle(hanger.unfocus[0], hanger.unfocus[1], hanger.unfocus[2], hanger.unfocus[3]);
        hanger.focusStatus = false;
      }
    }
  }

  function dragEnd(evt) {
    isMouseDown = false;
    var currentHanger = null;
    for (var hangerIdx = 0; hangerIdx < hangers.length; hangerIdx++) {
      var hanger = hangers[hangerIdx];
      if (!hanger.available) continue;
      hanger.sourceRect = new createjs.Rectangle(hanger.unfocus[0], hanger.unfocus[1], hanger.unfocus[2], hanger.unfocus[3]);
      hanger.focusStatus = false;
      if (distance(hanger, { "x": evt.stageX, "y": evt.stageY }) < 80) {
        currentHanger = hanger;
      }
    }
    if (currentHanger) {
      if ("item" in currentHanger && currentHanger.item) {
        var itemBmp = currentHanger.item.body.GetUserData();
        world.DestroyJoint(currentHanger.item.joint);
        currentHanger.item.status = "off";
        currentHanger.item.joint = null;
      }
      joints.push(revoluteJoint(currentHanger.body, this.body, new b2Vec2(0, 0.5), new b2Vec2(0, -this.getBounds().width * this.scaleX / worldScale / 2)));
      this.joint = joints[joints.length - 1];
      this.status = "on";
      this.hanger = currentHanger;
      currentHanger.item = this;
      items[currentHanger.index].currentLabel = this.label;
      items[currentHanger.index].status = "on";
    }
  }

  createQuestionTab();

  // 创建问题栏
  function createQuestionTab() {
    // 问题栏背景
    var questionBg = new createjs.Bitmap(images['inputQuestionBg'])
    questionBg.name = 'questionBg'
    questionBg.regY = questionBg.getBounds().height / 2
    questionBg.x = 0
    questionBg.y = canHeight - questionBg.getBounds().height / 2 - 10
    world_current.addChild(questionBg)
    var currentEpisodeQuestion = quiz_content[qWord]['episodes'][currentEpisode]['question'];
    var questionBg = world_current.getChildByName('questionBg')
    var questionTextCon = createStrBmpCon(currentEpisodeQuestion['text'], currentEpisodeQuestion['textData'])
    var questionIcons = new createjs.Bitmap(images['inputCtrlIcons'])
    var inputData = [98, 176, 90, 54],
      sureData = [343, 168, 144, 81]
    questionIcons.cache(0, 0, questionIcons.getBounds().width, questionIcons.getBounds().height)
    if (currentEpisodeQuestion['type'] === 'input') {
      var questionCtrl = questionIcons.clone()
      questionCtrl.sourceRect = new createjs.Rectangle(inputData[0], inputData[1], inputData[2], inputData[3])
      questionCtrl.regX = questionCtrl.getBounds().width / 2
      questionCtrl.regY = questionCtrl.getBounds().height / 2
      questionCtrl.y = questionBg.y
      questionCtrl.name = 'questionCtrl'
      questionCtrl.on('click', function () {
        bindQuestionCtrl(this, currentEpisodeQuestion['answer'], answerRight)
      })
      var questionCtrlAnswer = new createjs.Text('?', '32px Arial', '#08918c')
      questionCtrlAnswer.regX = questionCtrlAnswer.getBounds().width / 2
      questionCtrlAnswer.regY = questionCtrlAnswer.getBounds().height / 2
      questionCtrlAnswer.name = 'questionCtrlAnswer'
      questionCtrlAnswer.y = questionCtrl.y
      questionCtrlAnswer.on('click', function () {
        questionCtrl.dispatchEvent('click')
      })
      questionCtrl.textTarget = questionCtrlAnswer
    } else if (currentEpisodeQuestion['type'] === 'select') {
      for (var i = 0; i < questionTextCon.clickElements.length; i++) {
        var ele = questionTextCon.clickElements[i];
        if (ele.canClick) {
          ele.on('click', function () {
            if (this.isAnswer) {
              answerRight()
            } else {
              answerWrong()
            }
          })
        }
      }
    } else if (currentEpisodeQuestion['type'] === 'sure') {
      var questionCtrlSure = questionIcons.clone()
      questionCtrlSure.sourceRect = new createjs.Rectangle(sureData[0], sureData[1], sureData[2], sureData[3])
      questionCtrlSure.scaleX = questionCtrlSure.scaleY = 0.8
      questionCtrlSure.regX = questionCtrlSure.getBounds().width / 2
      questionCtrlSure.regY = questionCtrlSure.getBounds().height / 2
      questionCtrlSure.x = canWidth - questionCtrlSure.getBounds().width
      questionCtrlSure.on('click', function () {
        checkAnswer()
      })
    }
    var questionCon = new createjs.Container()
    questionCon.name = 'questionCon'
    questionCon.x = canWidth
    questionCon.alpha = 0
    questionTextCon.name = 'questionTextCon'
    questionTextCon.regY = questionTextCon.getBounds().height / 2
    questionTextCon.x = questionTextCon.getBounds().width / 2 + 40
    questionTextCon.y = questionBg.y
    questionCon.addChild(questionTextCon)
    if (currentEpisodeQuestion['type'] === 'input') {
      questionCtrl.x = questionTextCon.getBounds().width + 100
      questionCtrlAnswer.x = questionCtrl.x
      questionCon.addChild(questionCtrl, questionCtrlAnswer)
    } else if (currentEpisodeQuestion['type'] === 'sure') {
      questionCtrlSure.y = questionBg.y
      questionCon.addChild(questionCtrlSure)
    }
    world_current.addChild(questionCon)
    createjs.Tween.get(questionCon)
      .to({
        x: 0,
        alpha: 1
      }, 600)
  }
  /**
   * 处理字符串转图片
   * str string 需要处理的字符串
   * replaceData 需要替换的数据
   * return 文字容器 container
   */
  function createStrBmpCon(str, replaceData) {
    if (!str) {
      return
    }
    var container = new createjs.Container()
    container.clickElements = []
    if (!replaceData) {
      var text = new createjs.Text(str, '30px Arail', '#08918c')
      text.x = 0
      text.y = text.getBounds().height / 2
      text.regY = text.getBounds().height / 2
      container.addChild(text)
      container.regX = container.getBounds().width / 2
      container.regY = container.getBounds().height / 2
      return container
    }
    var reg = /#(.+?)#/g,
      regArr = [],
      strArr = [],
      allArr = [],
      checkRepeatArr = [],
      start = true,
      regTemp = null,
      strTempArr = [],
      strTemp = str,
      index = 0
    // 取特殊文字
    while (start) {
      regTemp = reg.exec(str)
      if (!regTemp) {
        start = null
        regTemp = null
        regExec = null
        reg = null
        break
      }
      var regExec = {}
      regExec.key = regTemp[1]
      regExec.index = regTemp['index']
      regExec.needChange = true
      regExec.data = replaceData[index]
      index++
      regArr.push(regExec)
    }
    // 取普通文字
    for (var i = 0; i < regArr.length; i++) {
      var regData = regArr[i]
      var regDataStr = '#' + regData.key + '#'
      strTemp = strTemp.replace(regDataStr, '^')
      strTempArr = strTemp.split('^')
    }
    var strTempArrLength = strTempArr.length
    for (var i = 0; i < strTempArrLength; i++) {
      var strData = strTempArr[i],
        isInclude = false,
        repeatIndex = 0,
        // 默认第一个
        strIndex = str.indexOf(strData, 0)
      // 检查字符串重复
      for (var j = 0; j < checkRepeatArr.length; j++) {
        var repeat = checkRepeatArr[j]
        if (repeat.text === strData) {
          isInclude = true
          repeatIndex = j
          // 重新查找
          strIndex = str.indexOf(strData, repeat.index + repeat.text.length)
        } else if (repeat.text.indexOf(strData) > -1) {
          strIndex = str.indexOf(strData, repeat.index + repeat.text.length)
        }
      }
      if (isInclude) {
        checkRepeatArr[repeatIndex]['index'] = strIndex
      } else {
        checkRepeatArr.push({ text: strData, index: strIndex })
      }
      if (strData && strIndex !== -1) {
        strArr.push({ key: strData, index: strIndex })
      }
    }
    allArr = regArr.concat(strArr)
    allArr.sort(compare('index'))
    for (var i = 0; i < allArr.length; i++) {
      var bmpData = allArr[i], textBmp = null, areaData
      if (bmpData.data && (bmpData.data.type === 'bitmap' || bmpData.data.type === 'bitmaparea')) {
        textBmp = new createjs.Bitmap(images[bmpData.data.id])
        if (bmpData.data.scaleX) {
          textBmp.scaleX = bmpData.data.scaleX
        } else {
          textBmp.scaleX = 1
        }
        if (bmpData.data.scaleY) {
          textBmp.scaleY = bmpData.data.scaleY
        } else {
          textBmp.scaleY = 1
        }
        if (bmpData.data.type === 'bitmaparea') {
          areaData = bitmapAreas[bmpData.data.key]
          textBmp.sourceRect = new createjs.Rectangle(areaData[0], areaData[1], areaData[2], areaData[3])
        }
      } else if (bmpData.data && bmpData.data.type === 'text') {
        var font = '', size = '', color = ''
        if (bmpData.data.font) {
          font = bmpData.data.font
        } else {
          font = 'Arial'
        }
        if (bmpData.data.size) {
          size = bmpData.data.size
        } else {
          size = '40px'
        }
        if (bmpData.data.color) {
          color = bmpData.data.color
        } else {
          color = '#08918c'
        }
        textBmp = new createjs.Text(bmpData.key, size + ' ' + font, color)
      } else {
        textBmp = new createjs.Text(bmpData.key, '30px Arial', '#08918c')
      }
      textBmp.x = container.getBounds() ? container.getBounds().width + 15 : 0
      textBmp.regY = textBmp.getBounds().height / 2

      container.addChild(textBmp)
      if (bmpData.data && bmpData.data.canClick) {
        textBmp.isAnswer = bmpData.data.isAnswer
        textBmp.canClick = bmpData.data.canClick
        container.clickElements.push(textBmp)
      }
    }
    var containerH = container.getBounds().height
    for (var i = 0; i < container.children.length; i++) {
      var child = container.children[i];
      child.y = containerH / 2
    }
    container.regX = container.getBounds().width / 2
    container.regY = container.getBounds().height / 2
    compare = null
    return container
    // 排序
    function compare(property) {
      return function (a, b) {
        var value1 = a[property];
        var value2 = b[property];
        return value1 - value2;
      }
    }
  }
  /**
   * 问题弹层
   * target 点击激活的对象
   * answer 答案
   * callback 回调
   */
  function bindQuestionCtrl(target, answer, callback) {
    var answerCtrlCon = new createjs.Container()
    var answerCtrlBg = new createjs.Bitmap(images['inputCtrlBg'])
    var questionIcons = new createjs.Bitmap(images['inputCtrlIcons'])
    var iconsData = [
      [85, 85, 81, 81],
      [251, 85, 81, 81],
      [334, 85, 81, 81],
      [168, 85, 81, 81],
      [321, 2, 81, 81],
      [72, 2, 81, 81],
      [404, 2, 81, 81],
      [155, 2, 81, 81],
      [238, 2, 81, 81],
      [2, 85, 81, 81]
    ]
    var answerCtrlSureWhiteData = [197, 168, 144, 81],
      answerCtrlSureData = [343, 168, 144, 81],
      answerCtrlCloseData = [2, 168, 85, 85],
      answerCtrlClearData = [2, 2, 68, 68]
    answerCtrlCon.scaleX = 0
    answerCtrlCon.scaleY = 0
    answerCtrlCon.alpha = 0
    answerCtrlCon.regX = answerCtrlBg.getBounds().width / 2
    answerCtrlCon.regY = answerCtrlBg.getBounds().height / 2
    var targetPos = null
    targetPos = target.globalToLocal(0, 0)
    answerCtrlCon.x = -targetPos.x
    answerCtrlCon.y = -targetPos.y
    var answerCtrlSureWhite = questionIcons.clone()
    answerCtrlSureWhite.sourceRect = new createjs.Rectangle(answerCtrlSureWhiteData[0], answerCtrlSureWhiteData[1], answerCtrlSureWhiteData[2], answerCtrlSureWhiteData[3])
    answerCtrlSureWhite.regX = answerCtrlSureWhite.getBounds().width / 2
    answerCtrlSureWhite.regY = answerCtrlSureWhite.getBounds().height / 2
    answerCtrlSureWhite.x = answerCtrlBg.getBounds().width / 2
    answerCtrlSureWhite.y = answerCtrlBg.getBounds().height - 50
    answerCtrlSureWhite.visible = true
    var answerCtrlSure = questionIcons.clone()
    answerCtrlSure.sourceRect = new createjs.Rectangle(answerCtrlSureData[0], answerCtrlSureData[1], answerCtrlSureData[2], answerCtrlSureData[3])
    answerCtrlSure.regX = answerCtrlSure.getBounds().width / 2
    answerCtrlSure.regY = answerCtrlSure.getBounds().height / 2
    answerCtrlSure.x = answerCtrlBg.getBounds().width / 2
    answerCtrlSure.y = answerCtrlSureWhite.y
    answerCtrlSure.visible = false
    answerCtrlSure.on('click', function () {
      world_current.removeChild(answerCtrlMask)
      createjs.Tween.get(answerCtrlCon)
        .to({
          x: -targetPos.x,
          y: -targetPos.y,
          scaleX: 0,
          scaleY: 0,
          alpha: 0
        }, 300)
        .call(function () {
          var text = answerCtrlText.text ? answerCtrlText.text : '?'
          world_current.removeChild(answerCtrlCon)
          target.textTarget.text = text
          target.textTarget.regX = target.textTarget.getBounds().width / 2
          if (!answer) {
            return
          }
          var questionCon = world_current.getChildByName('questionCon')
          if (Math.floor(answerCtrlText.text) === answer) {
            playEffectSound('diandui');
            callback()
          } else {
            playEffectSound('diancuo');
            createjs.Tween.get(questionCon)
              .to({
                x: questionCon.x - 5
              }, 100)
              .to({
                x: questionCon.x + 10
              }, 200)
              .to({
                x: questionCon.x - 5
              }, 200)
              .to({
                x: questionCon.x
              }, 100)
            playEffectSound('incorrect_' + randomInt(1, 4).toString());
          }
        })
    })
    var answerCtrlClose = questionIcons.clone()
    answerCtrlClose.sourceRect = new createjs.Rectangle(answerCtrlCloseData[0], answerCtrlCloseData[1], answerCtrlCloseData[2], answerCtrlCloseData[3])
    answerCtrlClose.regX = answerCtrlClose.getBounds().width / 2
    answerCtrlClose.regY = answerCtrlClose.getBounds().height / 2
    answerCtrlClose.x = 466
    answerCtrlClose.y = 6
    answerCtrlClose.on('click', function (evt) {
      evt.stopPropagation()
      world_current.removeChild(answerCtrlCon)
      world_current.removeChild(answerCtrlMask)
    })
    var answerCtrlClear = questionIcons.clone()
    answerCtrlClear.sourceRect = new createjs.Rectangle(answerCtrlClearData[0], answerCtrlClearData[1], answerCtrlClearData[2], answerCtrlClearData[3])
    answerCtrlClear.regX = answerCtrlClear.getBounds().width / 2
    answerCtrlClear.regY = answerCtrlClear.getBounds().height / 2
    answerCtrlClear.x = 55
    answerCtrlClear.y = 42
    answerCtrlClear.on('click', function (evt) {
      evt.stopPropagation()
      answerCtrlText.text = ''
      answerCtrlSureWhite.visible = true
      answerCtrlSure.visible = false
    })
    var answerCtrlText = new createjs.Text('', '50px Arial', '#CF7836')
    answerCtrlText.regY = 20
    answerCtrlText.x = 427
    answerCtrlText.y = 50
    answerCtrlCon.addChild(answerCtrlBg, answerCtrlSure, answerCtrlSureWhite, answerCtrlClear, answerCtrlText, answerCtrlClose)
    for (var i = 0; i < iconsData.length; i++) {
      var inputNum = questionIcons.clone()
      var inputNumData = iconsData[i]
      inputNum.sourceRect = new createjs.Rectangle(inputNumData[0], inputNumData[1], inputNumData[2], inputNumData[3])
      inputNum.x = 40 + 82 * (i % 5)
      inputNum.y = 105 + 90 * Math.floor(i / 5)
      inputNum.index = i + 1
      if (i === 9) {
        inputNum.index = 0
      }
      inputNum.on('click', function () {
        answerCtrlSureWhite.visible = false
        answerCtrlSure.visible = true
        if (Math.floor(answerCtrlText.text) * 10 + this.index > 9999) {
          createjs.Tween.get(answerCtrlText)
            .to({
              scaleX: 1.1,
              scaleY: 1.1
            }, 200)
            .to({
              scaleX: 1,
              scaleY: 1
            }, 200)
          return
        } else {
          answerCtrlText.text = Math.floor(answerCtrlText.text) * 10 + this.index
          answerCtrlText.regX = answerCtrlText.getBounds().width
        }
      })
      answerCtrlCon.addChild(inputNum)
    }
    var answerCtrlMask = new createjs.Shape()
    answerCtrlMask.graphics.beginFill('#000').drawRect(0, 0, canWidth, canHeight)
    answerCtrlMask.alpha = 0.3
    answerCtrlMask.on('mousedown', function (evt) {
      evt.stopPropagation()
      world_current.removeChild(answerCtrlCon)
      world_current.removeChild(answerCtrlMask)
    })
    answerCtrlMask.on('pressmove', function (evt) {
      evt.stopPropagation()
    })
    answerCtrlMask.on('pressup', function (evt) {
      evt.stopPropagation()
    })
    createjs.Tween.get(answerCtrlCon)
      .to({
        x: canWidth / 2,
        y: canHeight / 2,
        scaleX: 1,
        scaleY: 1,
        alpha: 1
      }, 300)
    world_current.addChild(answerCtrlMask, answerCtrlCon)
  }

  // 回答正确之后
  function answerRight() {
    var questionCon = world_current.getChildByName('questionCon')
    playEffectSound('tuodui');
    createjs.Tween.get(questionCon)
      .wait(1000)
      .to({
        alpha: 0
      }, 500)
      .call(function () {
        if (currentEpisode === quiz_content[qWord]['episodes']["length"] - 1) {
          if (!totalScores[qWord]) {
            recordScore(0);
          }
          currentEpisode = 0;
          subNarrations = [];
          isCorrect = true;
          quiz_effect();

          moveTarget = null
          createElement = null
          createDesCon = null
          createQuestionTab = null
          createStrBmpCon = null
          answerRight = null
          answerWrong = null
          createAllSrc = null
          checkAnswer = null
        } else {
          world_current.removeChild(questionCon)
          currentEpisode++
          pendant_init(episodes[currentEpisode]);
        }
      })
  }

  // 回答错误之后
  function answerWrong() {
    // 问题容器
    var questionCon = world_current.getChildByName('questionCon')
    playEffectSound('tuocuo');
    createjs.Tween.get(questionCon)
      .to({
        x: questionCon.x - 5
      }, 100)
      .to({
        x: questionCon.x + 10
      }, 200)
      .to({
        x: questionCon.x - 5
      }, 200)
      .to({
        x: questionCon.x
      }, 100)
    playEffectSound('incorrect_' + randomInt(1, 4).toString());
  }

  // 检查答案
  function checkAnswer() {
    var isRight = true;
    for (var idx = 0; idx < items.length; idx++) {
      if (items[idx].label > 0 && items[idx].currentLabel != items[idx].label) {
        isRight = false;
        break;
      }
    }
    if (isRight) {
      answerRight()
    } else {
      answerWrong()
    }
  }


}

function revoluteJoint(bodyA, bodyB, anchorA, anchorB) {
  var revoluteJointDef = new b2RevoluteJointDef();
  revoluteJointDef.localAnchorA.Set(anchorA.x, anchorA.y);
  revoluteJointDef.localAnchorB.Set(anchorB.x, anchorB.y);
  revoluteJointDef.bodyA = bodyA;
  revoluteJointDef.bodyB = bodyB;
  return world.CreateJoint(revoluteJointDef);
}

function weldJoint(bodyA, bodyB, anchorA, anchorB) {
  var weldJointDef = new b2WeldJointDef();
  weldJointDef.bodyA = bodyA;
  weldJointDef.bodyB = bodyB;
  weldJointDef.localAnchorA.Set(anchorA.x, anchorA.y);
  weldJointDef.localAnchorB.Set(anchorB.x, anchorB.y);
  weldJointDef.collideConnected = false;
  return world.CreateJoint(weldJointDef);
}

function begin_quizmopendant() {
  _quizActive = true;
  if (currentEpisode == 0) playSound('q_' + qWord, function () {
    playSubSound(actionAnimate)
  });
  else playSubSound(actionAnimate);
}

function narrDone_quizmopendant() {
}

function end_quizmopendant(tick) {
  createjs.Ticker.setFPS(10)
  createjs.Ticker.removeEventListener("tick", allTickerManager);
  createjs.Ticker.removeEventListener("tick", tick)
  for (var jointIdx = 0; jointIdx < joints.length; jointIdx++) {
    world.DestroyJoint(joints[jointIdx]);
  }
  var body = world.GetBodyList();
  while (body) {
    world.DestroyBody(body);
    body = body.GetNext();
  }
  bodies = [];
  joints = [];
}

function PendantBear() {
  this.initialize();
  this.rects = {};
  this.rects["right-eye"] = [[2, 2, 65, 19], [69, 2, 65, 19]];
  this.rects["left-eye"] = [[2, 2, 60, 18], [64, 2, 60, 18]];
  this.rects["right-hand"] = [[2, 2, 39, 47], [43, 2, 39, 47]];
  this.rects["left-hand"] = [[2, 2, 40, 59], [44, 2, 40, 59]];
  this.leftEye = new createjs.Bitmap(images["pendant-left-eye"]);
  this.rightEye = new createjs.Bitmap(images["pendant-right-eye"]);
  this.leftHand = new createjs.Bitmap(images["pendant-left-hand"]);
  this.rightHand = new createjs.Bitmap(images["pendant-right-hand"]);
  this.leftEye.sourceRect = new createjs.Rectangle(this.rects["left-eye"][0][0], this.rects["left-eye"][0][1], this.rects["left-eye"][0][2], this.rects["left-eye"][0][3]);
  this.rightEye.sourceRect = new createjs.Rectangle(this.rects["right-eye"][0][0], this.rects["right-eye"][0][1], this.rects["right-eye"][0][2], this.rects["right-eye"][0][3]);
  this.leftHand.sourceRect = new createjs.Rectangle(this.rects["left-hand"][0][0], this.rects["left-hand"][0][1], this.rects["left-hand"][0][2], this.rects["left-hand"][0][3]);
  this.rightHand.sourceRect = new createjs.Rectangle(this.rects["right-hand"][0][0], this.rects["right-hand"][0][1], this.rects["right-hand"][0][2], this.rects["right-hand"][0][3]);
  this.leftEye.x = 278;
  this.leftEye.y = 375;
  this.rightEye.x = 645;
  this.rightEye.y = 368;
  this.leftHand.x = 260;
  this.leftHand.y = 430;
  this.rightHand.x = 685;
  this.rightHand.y = 425;
  this.leftEye.index = 0;
  this.rightEye.index = 0;
  this.leftHand.index = 0;
  this.rightHand.index = 0;
  this.addChild(this.leftEye);
  this.addChild(this.rightEye);
  this.addChild(this.leftHand);
  this.addChild(this.rightHand);
  this.timeGaps = [0.95, 0.3];
}
PendantBear.prototype = new createjs.Container();
PendantBear.prototype.Container_initialize = PendantBear.prototype.initialize;
PendantBear.prototype.initialize = function () {
  this.Container_initialize();
}
PendantBear.prototype.Container_draw = PendantBear.prototype.draw;
PendantBear.prototype.draw = function (ctx) {
  var rnd = Math.random();
  if (rnd > this.timeGaps[this.leftEye.index]) {
    var index = 1 - this.leftEye.index;
    var rect = this.rects["left-eye"][index];
    this.leftEye.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3]);
    this.leftEye.index = index;
  }
  rnd = Math.random();
  if (rnd > this.timeGaps[this.rightEye.index]) {
    var index = 1 - this.rightEye.index;
    var rect = this.rects["right-eye"][index];
    this.rightEye.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3]);
    this.rightEye.index = index;
  }
  rnd = Math.random();
  if (rnd > 0.95) {
    var index = 1 - this.leftHand.index;
    var rect = this.rects["left-hand"][index];
    this.leftHand.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3]);
    this.leftHand.index = index;
  }
  rnd = Math.random();
  if (rnd > 0.95) {
    var index = 1 - this.rightHand.index;
    var rect = this.rects["right-hand"][index];
    this.rightHand.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3]);
    this.rightHand.index = index;
  }
  this.Container_draw(ctx);
}

function PendantCloud(direction) {
  this.initialize();
  this.cloud = bitmapAll.clone();
  this.type = 1 + Math.floor(Math.random() * 3);
  var rect = bitmapAreas["pendant-cloud" + this.type];
  this.cloud.sourceRect = new createjs.Rectangle(rect[0], rect[1], rect[2], rect[3]);
  this.addChild(this.cloud);
  this.direction = direction;
  this.speed = 1 + Math.floor(Math.random() * 2);
}
PendantCloud.prototype = new createjs.Container();
PendantCloud.prototype.Container_initialize = PendantCloud.prototype.initialize;
PendantCloud.prototype.initialize = function () {
  this.Container_initialize();
}
PendantCloud.prototype.Container_draw = PendantCloud.prototype.draw;
PendantCloud.prototype.draw = function (ctx) {
  if (this.direction > 0) {
    this.x += this.speed;
    if (this.x >= stage.canvas.width) {
      this.x = -100;
    }
  } else {
    this.x -= this.speed;
    if (this.x < -this.getBounds().width) {
      this.x = stage.canvas.width;
    }
  }
  this.Container_draw(ctx);
}
