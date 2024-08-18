import React from 'react';
import PropTypes from 'prop-types';
import { InputWidget } from '../widgets';
import DEFAULT_COMPONENTS from './DefaultComponents';
import PropertyRow from './PropertyRow';
import Collapsible from '../Collapsible';
import classnames from 'classnames';
import {
  getEntityClipboardRepresentation,
  printEntity
} from '../../lib/entity';
import Events from '../../lib/Events';
import Clipboard from 'clipboard';
import { saveBlob } from '../../lib/utils';
import GLTFIcon from '../../../../ui_assets/gltf.svg';

// @todo Take this out and use updateEntity?
function changeId(componentName, value) {
  var entity = AFRAME.INSPECTOR.selectedEntity;
  if (entity.id !== value) {
    entity.id = value;
    Events.emit('entityidchange', entity);
  }
}

export default class CommonComponents extends React.Component {
  static propTypes = {
    entity: PropTypes.object
  };

  onEntityUpdate = (detail) => {
    if (detail.entity !== this.props.entity) {
      return;
    }
    if (
      DEFAULT_COMPONENTS.indexOf(detail.component) !== -1 ||
      detail.component === 'mixin'
    ) {
      this.forceUpdate();
    }
  };

  componentDidMount() {
    Events.on('entityupdate', this.onEntityUpdate);

    var clipboard = new Clipboard('[data-action="copy-entity-to-clipboard"]', {
      text: (trigger) => {
        return getEntityClipboardRepresentation(this.props.entity);
      }
    });
    clipboard.on('error', (e) => {
      // @todo Show the error on the UI
    });
  }

  componentWillUnmount() {
    Events.off('entityupdate', this.onEntityUpdate);
  }

  renderCommonAttributes() {
    const entity = this.props.entity;
    // return ['position', 'rotation', 'scale', 'visible']
    return ['position', 'rotation', 'scale'].map((componentName) => {
      const schema = AFRAME.components[componentName].schema;
      var data = entity.object3D[componentName];
      if (componentName === 'rotation') {
        data = {
          x: THREE.MathUtils.radToDeg(entity.object3D.rotation.x),
          y: THREE.MathUtils.radToDeg(entity.object3D.rotation.y),
          z: THREE.MathUtils.radToDeg(entity.object3D.rotation.z)
        };
      }
      return (
        <PropertyRow
          key={componentName}
          name={componentName}
          schema={schema}
          data={data}
          isSingle={true}
          componentname={componentName}
          entity={entity}
        />
      );
    });
  }

  exportToGLTF() {
    const entity = this.props.entity;
    AFRAME.INSPECTOR.exporters.gltf.parse(
      entity.object3D,
      function (buffer) {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveBlob(blob, (entity.id || 'entity') + '.glb');
      },
      function (error) {
        console.error(error);
      },
      { binary: true }
    );
  }

  render() {
    const entity = this.props.entity;
    if (!entity) {
      return <div />;
    }
    const entityButtons = (
      <div>
        <a
          title="Export entity to GLTF"
          className="gltfIcon"
          onClick={(event) => {
            this.exportToGLTF();
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <img src={GLTFIcon} />
        </a>
        <a
          title="Copy entity HTML to clipboard"
          data-action="copy-entity-to-clipboard"
          className="button fa fa-clipboard"
        />
      </div>
    );

    const classNameID = classnames({
      propertyRow: true,
      hide: true
    });

    const classNameClass = classnames({
      propertyRow: true,
      hide: true
    });

    return (
      <Collapsible id="componentEntityHeader" className="commonComponents">
        <div className="collapsible-header">
          {printEntity(entity)}
          {entityButtons}
        </div>
        <div className="collapsible-content">
          <div className={classNameID}>
            <label htmlFor="id" className="text">
              ID
            </label>
            <InputWidget
              onChange={changeId}
              entity={entity}
              name="id"
              value={entity.id}
            />
          </div>
          <div className={classNameClass}>
            <label className="text">class</label>
            <span>{entity.getAttribute('class')}</span>
          </div>
          {this.renderCommonAttributes()}
        </div>
      </Collapsible>
    );
  }
}
