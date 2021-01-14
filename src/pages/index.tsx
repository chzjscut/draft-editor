import React from 'react';
import { Tabs, Button, Popover } from 'antd';
import Draft, {
  Editor,
  EditorState,
  SelectionState,
  convertToRaw,
  CompositeDecorator,
  getDefaultKeyBinding,
  KeyBindingUtil,
  RichUtils,
  AtomicBlockUtils,
  Modifier
} from 'draft-js';
const {hasCommandModifier} = KeyBindingUtil;
import Immutable from 'immutable';
import 'draft-js/dist/Draft.css';
import './index.less';
import mediaImage from '@/assets/media.png';
import PersonList from './personList';

const { TabPane } = Tabs;


const AtomicBlock = (props) => {
  const {block, contentState} = props;
  const entity = contentState.getEntity(block.getEntityAt(0));
  const {desc} = props.blockProps;
  //console.log(desc)
  const {src} = entity.getData();
  const type = entity.getType();

  let atomic = null;
  if(type === "image") {
    atomic = <img src={src} title={desc} />
  }

  return atomic;
}

const MyCustomBlock = (props) => {
  return (
    <div style={{border: "1px solid red"}}>
      {props.children}
    </div>
  )
}

const blockRenderMap = Immutable.Map({
  "section": {
    element: "section"
  },
  "MyCustomBlock": {
    element: "section",
    wrapper: <MyCustomBlock />,
  }
});

const extendedBlockRenderMap = Draft.DefaultDraftBlockRenderMap.merge(blockRenderMap);


const TokenSpan = (props) => {
  //console.log(props)
  const {block, contentState} = props;
  const data = contentState.getEntity(block.getEntityAt(0)).getData();
  //console.log(data)
  return (
    <span style={{backgroundColor: "red"}}>
      {block.text}
    </span>
  )
}

const MentionSpan = (props) => {
  const {name} = props.contentState.getEntity(props.entityKey).getData();
  return (
    <span style={{color: "blue"}}>{props.children}</span>
  )
}

const Link = (props) => {
  const {url} = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={url}>{props.children}</a>
  )
}

function findMentionEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null && contentState.getEntity(entityKey).getType() === "@Entity"
      )
    },
    callback
  )
}

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null && contentState.getEntity(entityKey).getType() === "LINK"
      )
    },
    callback
  )
}

const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: Link,
  },
  {
    strategy: findMentionEntities,
    component: MentionSpan,
  }
]);

export default class MyEditor extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      contentStateJson: '',
      editorState: EditorState.createEmpty(decorator)
    }

    //this.onChange = editorState => this.setState({editorState});
    this.onChange = this.onChange.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.toggleStyle = this.toggleStyle.bind(this);
    this.createEntity_A = this.createEntity_A.bind(this);
    this.createEntity_B = this.createEntity_B.bind(this);
    this.myBlockRenderer = this.myBlockRenderer.bind(this);
    this.myBlockStyleFn = this.myBlockStyleFn.bind(this);
    this.getSelectedPerson = this.getSelectedPerson.bind(this);
    this.handleBeforeInput = this.handleBeforeInput.bind(this);
  }

  onChange(editorState) {
    this.setState({editorState});
  }

  convertToRaw(editorState) {
    const contentState = editorState.getCurrentContent();
    const jsonData = convertToRaw(contentState);
    //console.log(jsonData)
    this.setState({
      contentStateJson: JSON.stringify(jsonData)
    });
  }

  /**
   * 绑定键盘事件
   *   keyBindingFn会为不同的按键行为返回不同的 command （如这里的 save），然后，
   *   在handleKeyCommand中为不同的 command 绑定不同的方法（操作）。
   */
  keyBindingFn(e) {
    console.log(e)
    if(e.keyCode === 83 /* `S` key */ && hasCommandModifier(e)) {
      return 'save';
    }
    return getDefaultKeyBinding(e);
  }

  handleBeforeInput(chars, editorState, eventTimeStamp) {
    //console.log(chars, eventTimeStamp)
    if(chars === "@") {
      this.setState({
        visible: true
      })
    }
  }

  //按键命令处理（如果是自定义的按键行为依赖 keyBindingFn 生成对应的 command）
  handleKeyCommand(command, editorState) {
    //console.log(command)
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
    //console.log(command, editorState)
    if(command === 'save') {
      //'save'对应的自定义事件处理
      //...
      return 'handled';
    }
    return 'not-handled';
  }

  //样式修改
  toggleStyle(style, blockType, editorState) {
    if(blockType === "inline") {
      this.onChange(RichUtils.toggleInlineStyle(editorState, style));
    } else if(blockType === "block") {
      this.onChange(RichUtils.toggleBlockType(editorState, style));
    }
  }

  /**
   * Entity（实体）
   *   所有 Entity 的静态方法都已经迁到 ContentState 中;
   *   可以通过 decorator(装饰器) 或者 custom block components(自定义block组件)来渲染 Entity
   */
  // Entity使用：1、创建 Link（通过 decorator）
  createEntity_A(type, editorState) {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity("LINK", "MUTABLE", {
      url: "https://www.baidu.com"
    });

    //获取最近创建的 Entity 的 entityKey
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    let newEditorState;
    switch (type) {
      case 1:
        //将选中的内容设置为 Entity
        const contentStateWithLink = Modifier.applyEntity(
          contentStateWithEntity,
          editorState.getSelection(),
          entityKey
        );

        newEditorState = EditorState.set(editorState, {
          currentContent: contentStateWithLink
        });

        this.onChange(newEditorState);

        break;

      case 2:
        //将选中的内容设置为 Entity 另一种方式
        newEditorState = EditorState.set(editorState, {
          currentContent: contentStateWithEntity
        });

        this.setState({
          editorState: RichUtils.toggleLink(
            newEditorState,
            newEditorState.getSelection(),
            entityKey
          )
        });

        //this.onChange(newEditorState);
        break;
    }
  }

  // Entity使用：2、配合 custom block components
  createEntity_B(type, editorState) {
    const contentState = editorState.getCurrentContent();
    if(type === 1) {
      //创建包含背景色的块元素
      const contentStateWithEntity = contentState.createEntity("TOKEN", "MUTABLE");
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

      const contentStateWithToken = Modifier.applyEntity(
        contentStateWithEntity,
        editorState.getSelection(),
        entityKey
      );

      const newEditorState = EditorState.set(editorState, {
        currentContent: contentStateWithToken
      });

      this.onChange(newEditorState);
    } else if(type === 2) {
      //创建image
      const contentStateWithEntity = contentState.createEntity("image", "IMMUTABLE", {
        src: mediaImage
      });
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

      const newEditorState = EditorState.set(editorState, {
        currentContent: contentStateWithEntity
      });

      const newNewEditorState = AtomicBlockUtils.insertAtomicBlock(
        newEditorState,
        entityKey,
        ' '
      );

      this.onChange(newNewEditorState);
    }
  }

  //自定义 Block Components
  myBlockRenderer(contentBlock) {
    //console.log(contentBlock.getType())
    const blockType = contentBlock.getType();
    if(blockType === "atomic") {
      return {
        component: AtomicBlock,
        editable: false,
        props: {
          desc: 'this is an image'
        }
      };
    }

    const { editorState } = this.state;
    const contentState = editorState.getCurrentContent();
    const linkKey = contentBlock.getEntityAt(0);
    if(linkKey) {
      const linkInstance = contentState.getEntity(linkKey);
      console.log(linkInstance.type)
      if(linkInstance.type === "TOKEN") {
        return {
          component: TokenSpan,
          editable: true,

        }
      }
    }
    
    return null;
  }

  //自定义block样式
  myBlockStyleFn(contentBlock) {
    const type = contentBlock.getType();
    //console.log(type)
    if(type === "paragraph") {
      return "css-paragraph";
    }
  }

  //获取选中的人员
  async getSelectedPerson(person) {
    const {editorState} = this.state;
    //console.log(person)
    this.setState({
      visible: false
    })
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    //console.log(selectionState.getAnchorOffset())

    /*let updatedSelection = selectionState2.merge({
      anchorOffset: selectionState.getAnchorOffset() - 1,
    });*/

    //获取到人员之后，创建Entity并通过decorator来渲染
    const contentStateWithEntity = contentState.createEntity("@Entity", "IMMUTABLE", person);
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    const contentStateWithReplaceText = Modifier.replaceText(
      contentState,
      selectionState,
      person.name,
      [],
      entityKey
    )
    let newEditorState = EditorState.push(editorState, contentStateWithReplaceText, "insert-characters");
    this.onChange(newEditorState);

    /*
    const contentStateWithMention = Modifier.applyEntity(
      contentStateWithEntity,
      updatedSelection,
      entityKey
    );
    const newNewEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithMention
    });
    //let newNewEditorState = EditorState.push(editorState, contentStateWithMention, "apply-entity");
    this.onChange(newNewEditorState)*/
  }

  render() {
    const { editorState, contentStateJson, visible } = this.state;
    return (
      <div>
        <div className="RichEditor-root">
          <Button onClick={() => {this.toggleStyle("BOLD", "inline", editorState)}}>Bold</Button>
          <Button onClick={() => {this.createEntity_A(1, editorState)}}>Entity应用1：标记Link（配合decorator）</Button>
          <Button onClick={() => {this.createEntity_A(2, editorState)}}>Entity应用2：标记Link（配合decorator）</Button>
          <Button onClick={() => {this.createEntity_B(1, editorState)}}>Entity应用3：配合custom block components</Button>
          <Button onClick={() => {this.createEntity_B(2, editorState)}}>Entity应用4：配合custom block components</Button>
          <Button onClick={() => {this.toggleStyle("paragraph", "block", editorState)}}>自定义设置块级元素样式</Button>
          <Button onClick={() => {this.toggleStyle("section", "block", editorState)}}>块级元素扩展：section</Button>
          <Button onClick={() => {this.toggleStyle("MyCustomBlock", "block", editorState)}}>块级元素扩展：自定义块级包裹元素</Button>
          <Editor
            //readOnly={true}
            editorState={this.state.editorState}
            keyBindingFn={this.keyBindingFn}
            handleKeyCommand={this.handleKeyCommand}
            handleBeforeInput={this.handleBeforeInput}
            blockRendererFn={this.myBlockRenderer}
            blockStyleFn={this.myBlockStyleFn}
            blockRenderMap={extendedBlockRenderMap}
            onChange={this.onChange}
          />

          <Popover
            visible={visible}
            title={"成员"}
            content={<PersonList onSelect={this.getSelectedPerson} />}
            placement="top"
          >
            
          </Popover>
        </div>
        <Button onClick={() => {this.convertToRaw(editorState)}}>convertToRaw</Button>
        <div>{contentStateJson}</div>
      </div>
    )
  }
}



// 一、Api说明
/**
 * Modifier(修饰符)
 *   Modifier模块是一组静态实用程序函数，用于封装ContentState对象上的常见编辑操作，强烈建议将这些方法用于编辑操作；
 *
 * Entity（实体）
 *   Entity用来通过metadata（元数据）给某个范围内的文本做标注（比如链接），可以扩展标注范围内文本的样式等；
 *   Entity通常会和decorator(装饰器，推荐) 或者 custom block components(自定义block组件，不推荐，因为作用范围是块级的，
 *   而且需要处理focus等问题) 一起使用，来区分目标范围内的文本：
 *   首先，通过ContentState.createEntity方法创建一个Entity（通过type创建不同的实体），draft会自动为每个Entity生成一个entityKey； 
 *   然后，通过 decorator 或者 custom block components来为创建的Entity绑定自定义组件，从而，创建的那个Entity对应的文本范围就会被
 *   替换为自定义组件；
 *
 *   注：在最新版本draft（v0.11+）中，所有 Entity 的静态方法都已经迁到 ContentState 中;
 */


// 二、常见问题
/**
 * 1、blockRendererFn 和 blockRenderMap 区别（Custom Block Rendering 和 Custom Block Components 区别）
 *     blockRendererFn用来渲染自定义块级组件，当contentBlock匹配到对应的条件时，就会渲染对应的自定义块级组件；
 *     blockRenderMap作用是用来修改或扩展draft自身的block type（draft的block type对应html的element，e.g. <h1/>, <div/>），此外，
 *     blockRenderMap还支持为block type设置自定义的wrapper（包裹元素），该wrapper（自定义的react component）会包裹在block type外部；
 *     blockRendererFn 可以根据 blockRenderMap 的 block type 来为其渲染自定义组件。
 * 2、
 */