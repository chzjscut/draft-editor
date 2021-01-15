import React, { useState, useEffect, useRef } from 'react';
import {List} from 'antd';

const data = [
  { id: 1, name: "杜培培"},
  { id: 2, name: "Lisa"},
  { id: 3, name: "小明"},
  { id: 3, name: "杜大壮"},
]
export default (props) => {
  const { searchKey, onSelect } = props;
  let listRef = useRef(null);
  const [filterData, setFilterData] = useState([]);

  useEffect(() => {
    console.log(searchKey)
    if(!searchKey) {
      setFilterData(data)
    } else {
      let filterdData = data.filter(item => item.name.includes(searchKey))
      if(filterdData.length === 0) {
        onSelect()
      }
      setFilterData(filterdData)
    }
  }, [searchKey])
  
  return (
    <div ref={listRef}>
      <List
        itemLayout="horizontal"
        dataSource={filterData}
        renderItem={item => (
          <List.Item onClick={() => {onSelect(item)}}>{item.name}</List.Item>
        )}
      />
    </div>
  )
}