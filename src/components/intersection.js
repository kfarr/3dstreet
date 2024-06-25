/* global AFRAME */
AFRAME.registerComponent('intersection', {
  schema: {
    dimensions: { type: 'string', default: '20 20' },
    sidewalk: { type: 'string', default: '0 0 0 0' },
    northeastcurb: { type: 'string', default: '0 0' },
    southwestcurb: { type: 'string', default: '0 0' },
    southeastcurb: { type: 'string', default: '0 0' },
    northwestcurb: { type: 'string', default: '0 0' },
    stopsign: { type: 'string', default: '0 0 0 0' },
    trafficsignal: { type: 'string', default: '0 0 0 0' },
    crosswalk: { type: 'string', default: '0 0 0 0' }
  },
  init: function () {
    var data = this.data;
    var el = this.el;

    // remove all child nodes if exists
    while (el.firstChild) {
      el.removeChild(el.lastChild);
    }
    const dimensionsArray = data.dimensions.split(' ').map((i) => Number(i));
    const positionArray = [
      this.el.getAttribute('position').x,
      this.el.getAttribute('position').y,
      this.el.getAttribute('position').z
    ];
    const sidewalkArray = data.sidewalk.split(' ').map((i) => Number(i));
    const northeastcurbArray = data.northeastcurb
      .split(' ')
      .map((i) => Number(i));
    const southwestcurbArray = data.southwestcurb
      .split(' ')
      .map((i) => Number(i));
    const southeastcurbArray = data.southeastcurb
      .split(' ')
      .map((i) => Number(i));
    const northwestcurbArray = data.northwestcurb
      .split(' ')
      .map((i) => Number(i));
    const stopsignArray = data.stopsign.split(' ').map((i) => Number(i));
    const trafficsignalArray = data.trafficsignal
      .split(' ')
      .map((i) => Number(i));
    const crosswalklArray = data.crosswalk.split(' ').map((i) => Number(i));

    const intersectWidth = dimensionsArray[0];
    const intersectDepth = dimensionsArray[1];

    this.el.setAttribute(
      'geometry',
      `primitive:box; width: ${intersectWidth}; height: ${intersectDepth}; depth:0.2`
    );
    this.el.setAttribute('position', {
      x: positionArray[0],
      y: -0.1,
      z: positionArray[2]
    });
    this.el.setAttribute('rotation', '-90 0 0');
    this.el.setAttribute(
      'material',
      'src: #asphalt-texture; repeat:5 5; roughness:1'
    );

    function createSidewalkElem({
      length,
      width,
      positionVec,
      scaleVec = { x: 1, y: 1, z: 1 },
      rotationVec
    }) {
      const sd = document.createElement('a-entity');
      const repeatCountInter = [];
      repeatCountInter[0] = width / 2;
      // every 2 meters repeat sidewalk texture
      repeatCountInter[1] = parseInt(length / 2);

      sd.setAttribute('geometry', 'primitive', 'box');
      sd.setAttribute('geometry', 'height: 0.4');
      sd.setAttribute('position', positionVec);
      sd.setAttribute('scale', scaleVec);
      sd.setAttribute('geometry', 'depth', length);
      sd.setAttribute('geometry', 'width', width);
      sd.setAttribute('rotation', rotationVec);
      sd.setAttribute('mixin', 'sidewalk');
      sd.setAttribute(
        'material',
        `repeat: ${repeatCountInter[0]} ${repeatCountInter[1]}`
      );
      el.appendChild(sd);
    }

    // describe sidewalk parameters
    const sidewalkParams = {
      west: {
        positionVec: { x: intersectWidth / 2 - sidewalkArray[0] / 2, z: 0.1 },
        rotationVec: { x: 90, y: 0, z: 0 },
        length: intersectDepth,
        width: sidewalkArray[0]
      },
      east: {
        positionVec: { x: -intersectWidth / 2 + sidewalkArray[1] / 2, z: 0.1 },
        rotationVec: { x: 90, y: 0, z: 0 },
        length: intersectDepth,
        width: sidewalkArray[1]
      },
      north: {
        positionVec: {
          y: -intersectDepth / 2 + sidewalkArray[2] / 2,
          // add x offset to avoid sidewalk's element overlap
          x: sidewalkArray[1] / 2 - sidewalkArray[0] / 2,
          z: 0.1
        },
        rotationVec: { x: 0, y: 90, z: -90 },
        // minus the width of the crossing sidewalk
        length: intersectWidth - sidewalkArray[1] - sidewalkArray[0],
        width: sidewalkArray[2]
      },
      south: {
        positionVec: {
          y: intersectDepth / 2 - sidewalkArray[3] / 2,
          // add x offset to avoid sidewalk's element overlap
          x: sidewalkArray[1] / 2 - sidewalkArray[0] / 2,
          z: 0.1
        },
        rotationVec: { x: 0, y: 90, z: -90 },
        // minus the width of the crossing sidewalk
        length: intersectWidth - sidewalkArray[1] - sidewalkArray[0],
        width: sidewalkArray[3]
      }
    };

    // create sidewalks if they are given in sidewalkArray
    const selectedSidewalks = Object.keys(sidewalkParams).filter(
      (el, ind) => sidewalkArray[ind]
    );

    selectedSidewalks.forEach((sidewalkName, ind) => {
      const params = sidewalkParams[sidewalkName];
      createSidewalkElem(params);
    });

    // describe curb parameters
    const curbParams = {
      northeast: {
        positionVec: {
          x: intersectWidth / 2 - northeastcurbArray[0] / 2,
          y: intersectDepth / 2 - northeastcurbArray[1] / 2,
          z: 0.1
        },
        rotationVec: { x: 0, y: 90, z: -90 },
        length: northeastcurbArray[0],
        width: northeastcurbArray[1]
      },
      southwest: {
        positionVec: {
          x: -intersectWidth / 2 + southwestcurbArray[0] / 2,
          y: -intersectDepth / 2 + southwestcurbArray[1] / 2,
          z: 0.1
        },
        rotationVec: { x: 0, y: 90, z: -90 },
        length: southwestcurbArray[0],
        width: southwestcurbArray[1]
      },
      southeast: {
        positionVec: {
          x: intersectWidth / 2 - southeastcurbArray[0] / 2,
          y: -intersectDepth / 2 + southeastcurbArray[1] / 2,
          z: 0.1
        },
        rotationVec: { x: 0, y: 90, z: -90 },
        length: southeastcurbArray[0],
        width: southeastcurbArray[1]
      },
      northwest: {
        positionVec: {
          x: -intersectWidth / 2 + northwestcurbArray[0] / 2,
          y: intersectDepth / 2 - northwestcurbArray[1] / 2,
          z: 0.1
        },
        rotationVec: { x: 0, y: 90, z: -90 },
        length: northwestcurbArray[0],
        width: northwestcurbArray[1]
      }
    };

    // create curbs if they are given
    for (const [curbName, params] of Object.entries(curbParams)) {
      if (data[`${curbName}curb`] !== '0 0') {
        createSidewalkElem(params);
      }
    }

    if (stopsignArray[0]) {
      const ss1 = document.createElement('a-entity');
      ss1.setAttribute('position', {
        x: intersectWidth / 2,
        y: intersectDepth / 3,
        z: 0.1
      });
      ss1.setAttribute('rotation', { x: 0, y: 90, z: 90 });
      ss1.setAttribute('mixin', 'stop_sign');
      el.appendChild(ss1);
    }
    if (stopsignArray[1]) {
      const ss2 = document.createElement('a-entity');
      ss2.setAttribute('position', {
        x: -intersectWidth / 2,
        y: -intersectDepth / 3,
        z: 0.1
      });
      ss2.setAttribute('rotation', { x: 0, y: -90, z: -90 });
      ss2.setAttribute('mixin', 'stop_sign');
      el.appendChild(ss2);
    }
    if (stopsignArray[2]) {
      const ss3 = document.createElement('a-entity');
      ss3.setAttribute('position', {
        x: -intersectWidth / 3,
        y: intersectDepth / 2,
        z: 0.1
      });
      ss3.setAttribute('rotation', { x: -90, y: 90, z: 90 });
      ss3.setAttribute('mixin', 'stop_sign');
      el.appendChild(ss3);
    }
    if (stopsignArray[3]) {
      const ss4 = document.createElement('a-entity');
      ss4.setAttribute('position', {
        x: intersectWidth / 3,
        y: -intersectDepth / 2,
        z: 0.1
      });
      ss4.setAttribute('rotation', { x: 90, y: -90, z: -90 });
      ss4.setAttribute('mixin', 'stop_sign');
      el.appendChild(ss4);
    }

    if (trafficsignalArray[0]) {
      const ts1 = document.createElement('a-entity');
      ts1.setAttribute('position', {
        x: intersectWidth / 2,
        y: intersectDepth / 3,
        z: 0.3
      });
      ts1.setAttribute('rotation', { x: 210, y: 90, z: 90 });
      ts1.setAttribute('mixin', 'signal_left');
      el.appendChild(ts1);
      const ts2 = document.createElement('a-entity');
      ts2.setAttribute('position', {
        x: intersectWidth / 2,
        y: -intersectDepth / 3,
        z: 0.3
      });
      ts2.setAttribute('rotation', { x: 180, y: 90, z: 90 });
      ts2.setAttribute('mixin', 'signal_right');
      el.appendChild(ts2);
    }
    if (trafficsignalArray[1]) {
      const ts3 = document.createElement('a-entity');
      ts3.setAttribute('position', {
        x: -intersectWidth / 2,
        y: -intersectDepth / 3,
        z: 0.3
      });
      ts3.setAttribute('rotation', { x: 30, y: 90, z: 90 });
      ts3.setAttribute('mixin', 'signal_left');
      el.appendChild(ts3);
      const ts4 = document.createElement('a-entity');
      ts4.setAttribute('position', {
        x: -intersectWidth / 2,
        y: intersectDepth / 3,
        z: 0.3
      });
      ts4.setAttribute('rotation', { x: 0, y: 90, z: 90 });
      ts4.setAttribute('mixin', 'signal_right');
      el.appendChild(ts4);
    }
    if (trafficsignalArray[2]) {
      const ts5 = document.createElement('a-entity');
      ts5.setAttribute('position', {
        x: -intersectWidth / 3,
        y: intersectDepth / 2,
        z: 0.1
      });
      ts5.setAttribute('rotation', { x: 120, y: 90, z: 90 });
      ts5.setAttribute('mixin', 'signal_left');
      el.appendChild(ts5);
      const ts6 = document.createElement('a-entity');
      ts6.setAttribute('position', {
        x: intersectWidth / 3,
        y: intersectDepth / 2,
        z: 0.1
      });
      ts6.setAttribute('rotation', { x: 90, y: 90, z: 90 });
      ts6.setAttribute('mixin', 'signal_right');
      el.appendChild(ts6);
    }
    if (trafficsignalArray[3]) {
      const ts7 = document.createElement('a-entity');
      ts7.setAttribute('position', {
        x: intersectWidth / 3,
        y: -intersectDepth / 2,
        z: 0.1
      });
      ts7.setAttribute('rotation', { x: -60, y: 90, z: 90 });
      ts7.setAttribute('mixin', 'signal_left');
      el.appendChild(ts7);
      const ts8 = document.createElement('a-entity');
      ts8.setAttribute('position', {
        x: -intersectWidth / 3,
        y: -intersectDepth / 2,
        z: 0.1
      });
      ts8.setAttribute('rotation', { x: -90, y: 90, z: 90 });
      ts8.setAttribute('mixin', 'signal_right');
      el.appendChild(ts8);
    }

    if (crosswalklArray[0]) {
      const cw1 = document.createElement('a-entity');
      cw1.setAttribute('position', { x: intersectWidth / 2 - 2, z: 0.11 });
      cw1.setAttribute('rotation', { x: 0, y: 0, z: 180 });
      cw1.setAttribute('scale', { y: intersectDepth / 12 });
      cw1.setAttribute('mixin', 'markings crosswalk-zebra');
      el.appendChild(cw1);
    }
    if (crosswalklArray[1]) {
      const cw2 = document.createElement('a-entity');
      cw2.setAttribute('position', { x: -intersectWidth / 2 + 2, z: 0.11 });
      cw2.setAttribute('rotation', { x: 0, y: 0, z: 180 });
      cw2.setAttribute('scale', { y: intersectDepth / 12 });
      cw2.setAttribute('mixin', 'markings crosswalk-zebra');
      el.appendChild(cw2);
    }
    if (crosswalklArray[2]) {
      const cw3 = document.createElement('a-entity');
      cw3.setAttribute('position', { y: -intersectDepth / 2 + 2, z: 0.11 });
      cw3.setAttribute('rotation', { x: 0, y: 0, z: 90 });
      cw3.setAttribute('scale', { y: intersectWidth / 12 });
      cw3.setAttribute('mixin', 'markings crosswalk-zebra');
      el.appendChild(cw3);
    }
    if (crosswalklArray[3]) {
      const cw4 = document.createElement('a-entity');
      cw4.setAttribute('position', { y: intersectDepth / 2 - 2, z: 0.11 });
      cw4.setAttribute('rotation', { x: 0, y: 0, z: 90 });
      cw4.setAttribute('scale', { y: intersectWidth / 12 });
      cw4.setAttribute('mixin', 'markings crosswalk-zebra');
      el.appendChild(cw4);
    }
  }
});