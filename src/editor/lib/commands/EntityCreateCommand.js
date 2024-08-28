import Events from '../Events';
import { Command } from '../command.js';
import { createEntity } from '../entity.js';

/**
 * Helper function to add a new entity with a list of components
 * @param  {object} definition Entity definition to add, only components is required:
 *   {element: 'a-entity', id: "hbiuSdYL2", class: "box", components: {geometry: 'primitive:box'}}
 * @return {Element} Entity created
 */
export class EntityCreateCommand extends Command {
  static type = 'entitycreate';
  constructor(editor, definition) {
    super(editor);

    this.name = 'Create Entity';
    this.definition = definition;
    this.entity = null;
  }

  execute() {
    const definition = this.definition;
    const callback = (entity) => {
      this.editor.selectEntity(entity);
    };
    const parentEl =
      this.definition.parentEl ?? document.querySelector('#street-container');
    this.entity = createEntity(definition, callback, parentEl);
    return this.entity;
  }

  undo() {
    if (this.entity) {
      this.editor.selectEntity(null);
      this.entity.parentNode.removeChild(this.entity);
      Events.emit('entityremoved', this.entity);
      this.entity = null;
    }
  }
}