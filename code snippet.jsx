/*
 * @desc Table组建
 * @param data: {dataIndex:any, name:string} [] 可选择数据
 * @param {String} active 当前选中的tab的key
 * @param {function} onSelect 点击的函数
 * @param {String} className 样式名 -> 可选
 * @param {Object} style 行内样式 -> 可选
*/
import React, { PureComponent } from 'react';
// import PropTypes from 'prop-types';
import styles from './table.css';
import { compareUp, compareDown } from '../utils/tool';

// const TablePropTypes = {
//   data: PropTypes.arrayOf(Object).isRequired,
//   columns: PropTypes.arrayOf(Object).isRequired,
//   className: PropTypes.string, // table的样式
//   contentClassName: PropTypes.string, // 列表内容的样式名
//   rowClick: PropTypes.func, // 数据行的点击事件
//   emptyData: PropTypes.oneOfType([// data为空数组时的显示
//     PropTypes.string,
//     PropTypes.element,
//   ]),
//   triangleColor: PropTypes.string, // 排序图标的颜色
//   footer: PropTypes.oneOfType([// 列表底部
//     PropTypes.string,
//     PropTypes.element,
//   ]),
//   scrollWidth: PropTypes.string, // 如果需要横向滚动时添加的的百分比: 150%
//   sortMap: PropTypes.shape({}), // 初始化的排序，排序由外部控制
//   getMore: PropTypes.func, // 上拉加载更多，监听离底部还有150出发，需要和getMoreLoading一起控制。
//   getMoreLoading: PropTypes.bool, // 控制是否正在加载及加载动效，false时不触发getMore事件
// };
const initData = (state) => {
  const sortObj = state.sortMap ? Object.keys(state.sortMap) : [];
  let list = state.data;
  if (sortObj && sortObj.length !== 0 && (state.sortMap[sortObj[0]] === 'ascend' || state.sortMap[sortObj[0]] === 'descend')) {
    list = state.sortMap[sortObj[0]] === 'ascend' ? list.sort(compareUp(sortObj[0])) : list.sort(compareDown(sortObj[0]));
  }
  return list;
};
export default class Table extends PureComponent {
  constructor(props) {
    // PropTypes.checkPropTypes(TablePropTypes, props);
    super(props);
    this.state = {
      data: this.props.sortMap && this.props.data ? initData(this.props) : this.props.data,
      sortMap: this.props.sortMap || {},
      showShadow: false,
    };
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.data !== nextProps.data) {
      this.setState({ data: initData({ sortMap: this.state.sortMap, ...nextProps }) });
    }
  }
  renderColumn = (column, index) => <div key={index}>1</div>
  renderFixedHeader = (fixedList) => {
    const style = this.state.showShadow ? { boxShadow: '4px 0 1px rgba(100, 100, 100, 0.1)' } : {};
    return (
      <div className={styles.table_fixed} style={style}>
        <ul >
          {fixedList.map((item, index) => <li style={{ width: `${100 / fixedList.length}%` }} key={index}>{item.title}</li>)}
        </ul>
      </div>
    );
  }
  clickSort = (item) => {
    // this.tableBodyScroll.scrollTop = 0;
    const { sortMap, data } = this.state;
    let newData = JSON.parse(JSON.stringify(data));
    const newSort = {};
    switch (sortMap[item.dataIndex]) {
      case 'ascend': newSort[item.dataIndex] = 'default';
        newData = this.props.data;
        break;
      case 'descend': newSort[item.dataIndex] = 'ascend';
        newData = newData.sort(compareUp(item.dataIndex));
        break;
      default: newSort[item.dataIndex] = 'descend';
        newData = newData.sort(compareDown(item.dataIndex));
    }

    if (item.sortFunc) {
      item.sortFunc({ ...item, newSort: newSort[item.dataIndex] });
      this.setState({ sortMap: newSort });
    } else {
      this.setState({ sortMap: newSort, data: newData });
    }
  }
  renderHeaderTitle = (item) => {
    const currSort = item.sortOrder || this.state.sortMap[item.dataIndex] || 'default';
    const Triangle = (
      <div className={styles.triangle_box} >
        <span style={{ borderBottomColor: currSort === 'ascend' ? '#FD7637' : this.props.triangleColor }} className={styles.triangle_up} />
        <span style={{ borderTopColor: currSort === 'descend' ? '#FD7637' : this.props.triangleColor }} className={styles.triangle_down} />
      </div>
    );
    return (
      <div
        className={styles.header_title}
        onClick={() => { if (item.sorter) this.clickSort(item); }}
        style={{ cursor: `${item.sorter ? 'pointer' : 'default'}` }}
      >
        <span header-key={item.dataIndex}>{ item.title }</span>
        { item.sorter && Triangle }
      </div>
    );
  }
  renderListHeader = (list, hasFixed) => {
    const { showHeaderOverflow } = this.props;
    const overflowStyle = showHeaderOverflow ? { overflow: 'visible' } : {};
    const style = hasFixed ? {} : { width: '100%' };
    return (
      <div
        className={styles.table_list}
        ref={(c) => { this.titlescroll = c; }}
        style={{ ...style, ...overflowStyle }}
      >
        <ul style={{ width: this.props.scrollWidth || '100%' }}>
          {list.map((item, index) =>
            (
              <li
                style={{ width: `${100 / list.length}%`, ...overflowStyle }}
                className={`${item.className ? item.className : ''}${item.dataIndex}`}
                key={index}
                li-type={item.dataIndex}
              >
                {this.renderHeaderTitle(item)}
              </li>
            ),
          )
          }
        </ul>
      </div>
    );
  }
  renderTableHeader = () => {
    const { columns, headerStyle = {} } = this.props;
    const fixedList = [];
    const list = [];
    if (columns.length > 0) {
      columns.forEach((column) => {
        if (column.fixed) fixedList.push(column);
        else list.push(column);
      });
    }
    return (
      <div className={styles.columns} style={{ ...headerStyle }}>
        { fixedList.length > 0 && this.renderFixedHeader(fixedList) }
        {list.length > 0 && this.renderListHeader(list, fixedList.length > 0) }
      </div>
    );
  }
  renderTableData = (data) => {
    const { columns, emptyData = '暂无数据' } = this.props;
    // if (!data || !columns || data.length === 0 || columns.length === 0) return null;
    const ColumnData = [];
    const keyList = columns.map(column => column.dataIndex); // 表头的顺序数组
    columns.forEach((column) => {
      ColumnData[column.dataIndex] = column;
    });
    const Data = [];
    data.forEach((item) => {
      const arr = [];
      keyList.forEach((key) => {
        arr.push({ ...item, key, value: item[key] });
      });
      Data.push(arr);
    });
    const fixedData = [];
    const TableData = [];
    Data.forEach((item) => {
      const fixedItemData = [];
      const tableItemData = [];
      item.forEach((d) => {
        if (ColumnData[d.key].fixed) fixedItemData.push({ ...ColumnData[d.key], ...d });
        else tableItemData.push({ ...ColumnData[d.key], ...d });
      });
      if (fixedItemData.length > 0) fixedData.push(fixedItemData);
      if (tableItemData.length > 0) TableData.push(tableItemData);
    });

    return (
      <div
        ref={(c) => { this.tableBodyScroll = c; }}
        className={`${styles.table_content} ${this.props.contentClassName || ''}`}
        onScroll={() => this.props.getMore && !this.props.getMoreLoading &&
        this.tableBodyScrollListener()}
      >
        { fixedData.length > 0 && this.renderTableContentFixed(fixedData) }
        { TableData.length > 0 && this.renderTableContentData(TableData, fixedData.length > 0) }
        { TableData.length === 0 &&
          <EmptyData >
            {emptyData}
          </EmptyData>
          }
        { this.props.footer && this.renderFooter() }
      </div>
    );
  }
  tableBodyScrollListener = () => {
    const { clientHeight, scrollTop, scrollHeight } = this.tableBodyScroll;
    if (scrollHeight - clientHeight - scrollTop <= 150) {
      this.props.getMore();
    }
  }
  rowClick = (item) => {
    if (this.props.rowClick) {
      this.props.rowClick(item);
    } else {
      window.location.href = `http://action:12051/?stockcode=${item.code.replace(/^[a-z]+/i, '')}`;
    }
  };
  renderRow = (data, key) =>
    (
      <ul key={key} >
        {data.map((item, index) => (
          <li
            style={{ width: `${100 / data.length}%` }}
            key={index}
            onClick={() => { this.rowClick(item); }}
          >
            {item.render ? item.render(item) : item.value}
          </li>),
        )}
      </ul>
    )
  scroolLeft = () => {
    const scrollLeftNum = this.scroll.scrollLeft;
    if (scrollLeftNum > 0) this.setState({ showShadow: true });
    else this.setState({ showShadow: false });
    this.titlescroll.scrollLeft = scrollLeftNum;
  }
  renderContentRow = (data, key) =>
    (
      <ul
        key={key}
        style={{ width: this.props.scrollWidth || '100%' }}
      >
        {
        data.map((item, index) =>

          // if (item.value === 0) {
          //   // eslint-disable-next-line no-param-reassign,no-undef
          //   item['filter-score'] = '--';
          //   console.log(item['filter-score']);
          // }
           (
             <li
               style={{ width: `${100 / data.length}%`, ...item.style, fontSize: 14 }}
               key={index}
               className={`${item.className ? item.className : ''}${item.dataIndex}`}
               onClick={() => { this.rowClick(item); }}
               li-type={item.dataIndex}
             >
               {item.render ? item.render(item) : item.value }
             </li>
          ),
        )}
      </ul>
    )
  renderTableContentFixed = (fixedData) => {
    const style = this.state.showShadow ? { boxShadow: '4px 0 4px rgba(100, 100, 100, 0.1)' } : {};
    return (
      <div className={styles.table_fixed} style={style}>
        {fixedData.map((data, index) => this.renderRow(data, index))}
      </div>
    );
  }
  onTouchMove = () => {

  }
  renderTableContentData = (TableData, hasFixed) => {
    const Width = hasFixed ? {} : { width: '100%' };
    return (
      <div
        className={styles.table_list}
        style={{ overflowX: 'auto', overflowY: 'hide', ...Width }}
        onScroll={this.scroolLeft}
        onTouchMove={this.onTouchMove}
        ref={(c) => { this.scroll = c; }}
      >
        {TableData.map((data, index) => this.renderContentRow(data, index))}
        {this.props.getMoreLoading && this.renderLoading()}
      </div>
    );
  }

  renderFooter = () => (<div style={{ width: '100%', textAlign: 'center' }}>{this.props.footer}</div>)
  renderLoading = () => (<div className={styles.loading}>Loading</div>)
  render() {
    const {
      className,
    } = this.props;
    const { data } = this.state;
    return (
      <div className={`${styles.table_box} ${className || ''}`}>
        { this.renderTableHeader() }
        { this.renderTableData(data) }
        {/* {this.props.footer && this.renderFooter()} */}
      </div>
    );
  }
}
// Table.propTypes = TablePropTypes;

const EmptyData = props => (
  <div className={styles.empty_data}>
    {props.children}
  </div>
);

