/* eslint-disable no-unused-vars, react/no-danger */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Events from '../../lib/Events';
import Entity from './Entity';
import { ToolbarWrapper } from './ToolbarWrapper';
import { LayersIcon, ArrowLeftIcon } from '../../icons';
import { getEntityDisplayName } from '../../lib/entity';
import posthog from 'posthog-js';

const HIDDEN_CLASSES = ['teleportRay', 'hitEntity'];
const HIDDEN_IDS = ['previewEntity'];

export default class SceneGraph extends React.Component {
  static propTypes = {
    scene: PropTypes.object,
    selectedEntity: PropTypes.object,
    visible: PropTypes.bool
  };

  static defaultProps = {
    selectedEntity: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      entities: [],
      expandedElements: new WeakMap([[props.scene, true]]),
      leftBarHide: false,
      selectedIndex: -1
    };
  }

  componentDidMount() {
    this.rebuildEntityOptions();
    Events.on('updatescenegraph', this.rebuildEntityOptions);
    Events.on('entityidchange', this.rebuildEntityOptions);
    Events.on('entitycreated', this.rebuildEntityOptions);
    Events.on('entityclone', this.rebuildEntityOptions);
    Events.on('entityupdate', (detail) => {
      if (detail.component === 'mixin') {
        this.rebuildEntityOptions();
      }
    });
  }

  /**
   * Selected entity updated from somewhere else in the app.
   */
  componentDidUpdate(prevProps) {
    if (prevProps.selectedEntity !== this.props.selectedEntity) {
      this.selectEntity(this.props.selectedEntity);
    }
  }

  toggleLeftBar = () => {
    this.setState({ leftBarHide: !this.state.leftBarHide });
  };

  selectEntity = (entity) => {
    let found = false;
    for (let i = 0; i < this.state.entities.length; i++) {
      const entityOption = this.state.entities[i];
      if (entityOption.entity === entity) {
        this.setState({ selectedIndex: i });
        // Make sure selected value is visible in scenegraph
        this.expandToRoot(entity);
        posthog.capture('entity_selected', {
          entity: getEntityDisplayName(entity)
        });
        Events.emit('entityselect', entity);
        found = true;
      }
    }

    if (!found) {
      this.setState({ selectedIndex: -1 });
    }
  };

  rebuildEntityOptions = () => {
    const entities = [];

    function treeIterate(element, depth) {
      if (!element) {
        return;
      }
      depth += 1;

      for (let i = 0; i < element.children.length; i++) {
        let entity = element.children[i];

        if (
          entity.dataset.isInspector ||
          !entity.isEntity ||
          entity.isInspector ||
          'aframeInspector' in entity.dataset ||
          HIDDEN_CLASSES.includes(entity.className) ||
          HIDDEN_IDS.includes(entity.id) ||
          (depth === 1 && !entity.id)
        ) {
          continue;
        }

        entities.push({ entity: entity, depth: depth });

        treeIterate(entity, depth);
      }
    }
    const layers = this.props.scene.children;
    const orderedLayers = [];

    for (const layer of layers) {
      if (layer.id === 'reference-layers') {
        orderedLayers.unshift(layer);
      } else if (layer.id === 'environment') {
        orderedLayers.splice(1, 0, layer);
      } else if (layer.id === 'street-container') {
        orderedLayers.splice(2, 0, layer);
      } else {
        orderedLayers.push(layer);
      }
    }

    treeIterate({ children: orderedLayers }, 0);

    this.setState((prevState) => ({
      entities: entities,
      expandedElements: orderedLayers.reduce((expandedElements, layer) => {
        return expandedElements.set(layer, true);
      }, prevState.expandedElements)
    }));
  };

  selectIndex = (index) => {
    if (index >= 0 && index < this.state.entities.length) {
      this.selectEntity(this.state.entities[index].entity);
    }
  };

  onKeyDown = (event) => {
    switch (event.keyCode) {
      case 37: // left
      case 38: // up
      case 39: // right
      case 40: // down
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  };

  onKeyUp = (event) => {
    if (this.props.selectedEntity === null) {
      return;
    }

    switch (event.keyCode) {
      case 37: // left
        if (this.isExpanded(this.props.selectedEntity)) {
          this.toggleExpandedCollapsed(this.props.selectedEntity);
        }
        break;
      case 38: // up
        this.selectIndex(
          this.previousExpandedIndexTo(this.state.selectedIndex)
        );
        break;
      case 39: // right
        if (!this.isExpanded(this.props.selectedEntity)) {
          this.toggleExpandedCollapsed(this.props.selectedEntity);
        }
        break;
      case 40: // down
        this.selectIndex(this.nextExpandedIndexTo(this.state.selectedIndex));
        break;
    }
  };

  isVisibleInSceneGraph = (x) => {
    let curr = x.parentNode;
    if (!curr) {
      return false;
    }
    while (curr !== undefined && curr.isEntity) {
      if (!this.isExpanded(curr)) {
        return false;
      }
      curr = curr.parentNode;
    }
    return true;
  };

  isExpanded = (x) => this.state.expandedElements.get(x) === true;

  toggleExpandedCollapsed = (x) => {
    this.setState({
      expandedElements: this.state.expandedElements.set(x, !this.isExpanded(x))
    });
  };

  expandToRoot = (x) => {
    // Expand element all the way to the scene element
    let curr = x.parentNode;
    while (curr !== undefined && curr.isEntity) {
      this.state.expandedElements.set(curr, true);
      curr = curr.parentNode;
    }
    this.setState({ expandedElements: this.state.expandedElements });
  };

  previousExpandedIndexTo = (i) => {
    for (let prevIter = i - 1; prevIter >= 0; prevIter--) {
      const prevEl = this.state.entities[prevIter].entity;
      if (this.isVisibleInSceneGraph(prevEl)) {
        return prevIter;
      }
    }
    return -1;
  };

  nextExpandedIndexTo = (i) => {
    for (
      let nextIter = i + 1;
      nextIter < this.state.entities.length;
      nextIter++
    ) {
      const nextEl = this.state.entities[nextIter].entity;
      if (this.isVisibleInSceneGraph(nextEl)) {
        return nextIter;
      }
    }
    return -1;
  };

  renderEntities = () => {
    const renderedEntities = [];
    const entityOptions = this.state.entities.filter((entityOption) => {
      if (!this.isVisibleInSceneGraph(entityOption.entity)) {
        return false;
      } else {
        return true;
      }
    });
    let children = [];
    for (let i = 0; i < entityOptions.length; i++) {
      const entityOption = entityOptions[i];
      const renderedEntity = (
        <Entity
          {...entityOption}
          key={i}
          isFiltering={!!this.state.filter}
          isExpanded={this.isExpanded(entityOption.entity)}
          isSelected={this.props.selectedEntity === entityOption.entity}
          selectEntity={this.selectEntity}
          toggleExpandedCollapsed={this.toggleExpandedCollapsed}
        />
      );
      children.push(renderedEntity);
      // wrap entities of depth 1 in <div class="layer">
      if (i === entityOptions.length - 1 || entityOptions[i + 1].depth === 1) {
        const className = classNames({
          layer: true,
          active: children[0].props.isSelected
        });
        renderedEntities.push(
          <div className={className} key={i}>
            {children}
          </div>
        );
        children = [];
      }
    }
    return renderedEntities;
  };

  render() {
    // To hide the SceneGraph we have to hide its parent too (#left-sidebar).
    if (!this.props.visible) {
      return null;
    }

    // Outliner class names.
    const className = classNames({
      outliner: true,
      hide: this.state.leftBarHide
    });

    return (
      <div id="scenegraph" className="scenegraph">
        <div className="scenegraph-toolbar">
          <ToolbarWrapper />
        </div>
        <div
          className={className}
          tabIndex="0"
          onKeyDown={this.onKeyDown}
          onKeyUp={this.onKeyUp}
        >
          <div
            className={'layersBlock'}
            id="layers-title"
            onClick={this.toggleLeftBar}
          >
            <div id="toggle-leftbar">
              <ArrowLeftIcon />
            </div>
            <div className={'layersBlock'}>
              <LayersIcon />
              <span>Layers</span>
            </div>
          </div>
          <div className="layers">{this.renderEntities()}</div>
        </div>
      </div>
    );
  }
}
