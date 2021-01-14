import React from 'react';
import {List} from 'antd';

const data = [
  { id: 1, name: "杜培培"},
  { id: 2, name: "Lisa"},
  { id: 3, name: "小明"},
]
export default (props) => {
  const { onSelect } = props;
  
  return (
    <List
      itemLayout="horizontal"
      dataSource={data}
      renderItem={item => (
        <List.Item onClick={() => {onSelect(item)}}>{item.name}</List.Item>
      )}
    />
  )
}