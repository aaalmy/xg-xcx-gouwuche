const app = getApp()

Page({
  data: {
    list: [
      {
        name: '商品1',
        price: 300,
        selectType: '选择规格',
        typeList: [
          {
            typeName: 'PERER',
            typePrice: 200
          },
          {
            typeName: 'RTGGD',
            typePrice: 400
          }
        ],
        profit: 0,
        number: 0,
        clickRadio: false
      },
      {
        name: '商品2',
        price: 400,
        selectType: '选择规格',
        typeList: [
          {
            typeName: 'PERER',
            typePrice: 200
          },
          {
            typeName: 'RTGGD',
            typePrice: 400
          }
        ],
        profit: 0,
        number: 0,
        clickRadio: false
      }
    ],
    show: false,
    //选择规格里应该显示哪几个类型
    typeList: [],
    //保存各个规格的原本价钱
    StaretypePrice: 0,
    typeListIndex: 0,
    // 总价格
    totalPrize: 0,
    // 总利润
    totallirun: 0,
    StaretotalPrice: 0,
    //保存最初总返利的价格
    Staretotallirun: 0
  },
  //点击选择规格时
  selectType(e) {
    this.setData({
      show: true,
      //这里之所以声明了typeListIndex来保存当前索引是为了方便后面用
      typeListIndex: e.target.dataset.index,
      //这里可以看到：左右都是相同的 因为下面又改变了typeList的值 所以右边也会跟着改变 所以这样是不行的 所以我们使用深克隆来解决同步更改的问题
      typeList: JSON.parse(JSON.stringify(this.data.list[e.target.dataset.index].typeList))
    })
  },
  //点击选择哪个类型
  seletePopupType(e) {
    this.data.typeList.forEach(element => (element.status = false))
    this.data.typeList[e.target.dataset.index].status = true
    this.setData({
      typeList: this.data.typeList
    })
  },

  /**
   * 当底部价格需要更新时，遍历整个商品列表，过滤出有选中的商品，然后累加计算对应的价格、利润，更新总价格，总利润及商品列表
   * 而底部的价格与规格、数量、商品的选中状态有关，也就是说有三个操作会触发这个价格更新，所以应该抽取成通用的函数
   */
  updatePrice(index) {
    this.data.list
      .filter(item => item.clickRadio)
      .forEach(item => {
        this.data.totalPrize += item.number * item.price
        this.data.totallirun += item.profit
      })
    this.setData({
      totalPrize: this.data.totalPrize,
      totallirun: this.data.totallirun
    })
  },
  // 选中一个商品，需要更新总价格
  // 要先判断他是否选了规格，是否有数量，满足这两个条件才能修改这个商品的选中状态
  // 如果这个商品可以被选中，需要更新底部价格
  clickRadio(e) {
    const { index } = e.target.dataset
    if (this.data.list[index].selectType === '选择规格') {
      wx.showToast({
        title: '请选择规格',
        icon: 'fail',
        duration: 1000
      })
    } else if (this.data.list[index].number === 0) {
      wx.showToast({
        title: '请选择数量',
        icon: 'fail',
        duration: 1000
      })
    } else {
      this.data.list[index].clickRadio = !this.data.list[index].clickRadio
      this.setData({
        list: this.data.list
      })
      this.data.totalPrize = 0
      this.updatePrice(index)
    }
  },

  vantPopupClose() {
    this.setData({
      show: false
    })
  },
  // 选中一个规格，需要更新总价格
  sure() {
    this.data.list[this.data.typeListIndex].typeList = this.data.typeList
    this.setData({
      list: this.data.list
    })
    //如何判断哪一个类型被选中 然后获取选中的名字？可以通过我们的控制台里的AppData来观察 可以看到选中时 typeList里的选中项的status会变成true 所以我们就根据查看这个数组里哪个status为true 就获取谁的名字
    //typeList是一个数组 找到这个数组里哪一项的status属性 为true
    if (this.data.list[this.data.typeListIndex].typeList.find(item => item.status)) {
      //find 函数已经返回了这一整项了 所以可以直接.typeName
      this.data.list[this.data.typeListIndex].selectType = this.data.list[this.data.typeListIndex].typeList.find(item => item.status).typeName
      //价格同步更改
      if (this.data.list[this.data.typeListIndex].number === 0) {
        this.data.list[this.data.typeListIndex].profit = this.data.list[this.data.typeListIndex].typeList.find(item => item.status).typePrice
      } else {
        this.data.list[this.data.typeListIndex].profit =
          this.data.list[this.data.typeListIndex].typeList.find(item => item.status).typePrice * this.data.list[this.data.typeListIndex].number
      }

      //this.setData只能设置最外一层属性 不能设置属性里面的属性 所以上面就先改变this.data.list里要改变的名字 再直接整个list重新赋值
      this.setData({
        list: this.data.list,
        show: false
      })
    }
  },
  //商品数量修改，需要更新总价格
  handleNum(e) {
    /**
     * 1. 如果 e.target.dataset.index等这些字段经常使用到，我们可以用解构赋值把他们抽出来 这样容易看很多 嗯嗯
     */
    const { index, handleType } = e.target.dataset
    // 1.subtract 这是字符串把
    // 2.所有的判断用 ===
    if (handleType === 'subtract') {
      if (this.data.list[index].number === 0) {
        wx.showToast({
          title: '数量不能低于0',
          icon: 'fail',
          duration: 1000
        })
        // 提示之后，return 出来，不执行下面的操作了
        return
      } else {
        /**
         * 商品数量的加减，需要什么信息？是哪个商品 哪个规格
         * 那你怎么判断他是哪个规格 选中哪一个
         * 怎么判断当前操作的是哪个商品的加减 不是跟之前一样吗 看哪个带有sure属性
         * sure 是一个函数 status
         * 通过status可以判断你当前操作的商品吗？ 先判断是哪个商品 再判断是哪个status
         * 对啊~ 所以怎么判断是哪个商品 通过点击请选择规格按钮获取参数 再获取对应的索引 就知道是哪个商品了
         * 那能不能点击加减的时候，直接获取索引 所以就是先判断有没有点击选择规格吗
         * 不是 你直接获取该索引，再去检查该索引对应的商品是否有选规格了 那要获取这个索引 不就是得先点击选择规格吗 不然怎么获取
         * 你选择规格的时候是怎么获取索引的 点击选择规格 获取参数
         * 那这里不就是一样的了~通过data-index 传过来就行了
         */
        this.data.list[index].number--
        if (this.data.list[index].profit !== 0) {
          this.data.StaretypePrice = this.data.list[index].typeList.find(item => item.status).typePrice
          this.data.list[index].profit = this.data.StaretypePrice * this.data.list[index].number
        }
        this.data.totalPrize -= 1 * this.data.list[index].price
        this.data.totallirun -= 1 * this.data.list[index].typeList.find(item => item.status).typePrice
        this.setData({
          list: this.data.list,
          totalPrize: this.data.totalPrize,
          totallirun: this.data.totallirun
        })
      }
    } else if (handleType === 'add') {
      this.data.list[index].number++
      // 你把list setdata 成一个数字了 对哦。。
      if (this.data.list[index].profit !== 0) {
        this.data.StaretypePrice = this.data.list[index].typeList.find(item => item.status).typePrice
        this.data.list[index].profit = this.data.StaretypePrice * this.data.list[index].number
      }
      //需要再次调用sure 因为赚的钱与规格以及数量有关
      this.sure()
      this.data.totalPrize = 0
      this.data.totallirun = 0
      this.updatePrice()
      this.setData({
        list: this.data.list
      })
    }
  }
})
