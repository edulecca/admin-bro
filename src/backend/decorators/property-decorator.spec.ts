import { expect } from 'chai'
import sinon from 'sinon'

import PropertyDecorator from './property-decorator'
import BaseProperty from '../adapters/base-property'
import AdminBro from '../../admin-bro'
import ResourceDecorator from './resource-decorator'

describe('PropertyDecorator', function () {
  let stubbedAdmin: AdminBro
  let property: BaseProperty
  let args: { property: BaseProperty; admin: AdminBro; resource: ResourceDecorator }

  beforeEach(function () {
    property = new BaseProperty({ path: 'name', type: 'string' })
    stubbedAdmin = sinon.createStubInstance(AdminBro)
    args = { property, admin: stubbedAdmin, resource: {} as ResourceDecorator }
  })

  describe('#isSortable', function () {
    it('passes the execution to the base property', function () {
      sinon.stub(BaseProperty.prototype, 'isSortable').returns(false)
      expect(new PropertyDecorator(args).isSortable()).to.equal(false)
    })
  })

  describe('#isVisible', function () {
    it('passess execution to BaseProperty.isVisible for list when no options are specified', function () {
      expect(new PropertyDecorator(args).isVisible('list')).to.equal(property.isVisible())
    })

    it('passess execution to BaseProperty.isEditable for edit when no options are specified', function () {
      sinon.stub(BaseProperty.prototype, 'isVisible').returns(false)
      expect(new PropertyDecorator(args).isVisible('edit')).to.equal(property.isEditable())
    })

    it('sets new value when it is changed for all views by isVisible option', function () {
      const decorator = new PropertyDecorator({ ...args, options: { isVisible: false } })
      expect(decorator.isVisible('list')).to.equal(false)
      expect(decorator.isVisible('edit')).to.equal(false)
      expect(decorator.isVisible('show')).to.equal(false)
    })
  })

  const fields = ['isId', 'isTitle', 'type', 'name']

  // eslint-disable-next-line mocha/no-setup-in-describe
  fields.forEach((field) => {
    describe(`#${field}`, function () {
      it('passess the execution to the overrideFromOptions', function () {
        const stub = sinon.stub(PropertyDecorator.prototype, 'overrideFromOptions')
        new PropertyDecorator(args)[field]()
        // for some reason chai dont know that calledWith is a property
        const assertion = expect(stub).to.have.been as any
        assertion.calledWith(field)
      })
    })
  })

  describe('#overrideFromOptions', function () {
    beforeEach(function () {
      this.field = 'name'
      this.value = 'valueSetByAdapter'
      sinon.stub(BaseProperty.prototype, this.field).returns(this.value)
    })

    it('passess the execution to the BaseProperty when no option is given', function () {
      const res = new PropertyDecorator(args).overrideFromOptions(this.field)
      expect(res).to.equal(this.value)
    })

    it('returns the value from options when they were specified', function () {
      this.overridenValue = 'overridenValue'
      const res = new PropertyDecorator({
        ...args,
        options: { [this.field]: this.overridenValue } }).overrideFromOptions(this.field)
      expect(res).to.equal(this.overridenValue)
    })

    it('calls the modifier function when no options were given', function () {
      const newValue = 'someModifierFunctionValue'
      const res = new PropertyDecorator(args).overrideFromOptions(this.field, () => newValue)
      expect(res).to.equal(newValue)
    })
  })

  describe('#label', function () {
    it('returns camelcased name', function () {
      sinon.stub(BaseProperty.prototype, 'name').returns('normalname')
      expect(new PropertyDecorator(args).label()).to.equal('Normalname')
    })
  })

  describe('#availableValues', function () {
    it('map default value to { value, label } object', function () {
      sinon.stub(BaseProperty.prototype, 'availableValues').returns(['val'])
      expect(new PropertyDecorator(args).availableValues()).to.deep.equal([{
        value: 'val',
        label: 'val',
      }])
    })
  })

  describe('#position', function () {
    it('returns -1 for title field', function () {
      sinon.stub(BaseProperty.prototype, 'isTitle').returns(true)
      expect(new PropertyDecorator(args).position()).to.equal(-1)
    })

    it('returns 100 for all other fields', function () {
      sinon.stub(BaseProperty.prototype, 'isTitle').returns(false)
      expect(new PropertyDecorator(args).position()).to.equal(100)
    })

    it('returns 0 for an id field', function () {
      sinon.stub(BaseProperty.prototype, 'isTitle').returns(false)
      sinon.stub(BaseProperty.prototype, 'isId').returns(true)
      expect(new PropertyDecorator(args).position()).to.equal(0)
    })
  })

  describe('#subProperties', function () {
    let propertyDecorator: PropertyDecorator
    const propertyName = 'super'
    const subPropertyName = 'neted'

    beforeEach(function () {
      property = new BaseProperty({ path: propertyName, type: 'string' })
      sinon.stub(property, 'subProperties').returns([
        new BaseProperty({ path: subPropertyName, type: 'string' }),
      ])

      propertyDecorator = new PropertyDecorator({
        ...args,
        property,
        resource: { options: {
          'super.nested': { label: 'nestedLabel' },
        } } as unknown as ResourceDecorator,
      })
    })

    it('returns the array of decorated properties', function () {
      expect(propertyDecorator.subProperties()).to.have.lengthOf(1)
      expect(propertyDecorator.subProperties()[0]).to.be.instanceOf(PropertyDecorator)
    })

    it('changes the first field name to be nested', function () {
      const subProperty = propertyDecorator.subProperties()[0]

      expect(subProperty.name()).to.eq(`${propertyName}.${subPropertyName}`)
    })
  })

  describe('#toJSON', function () {
    it('returns JSON representation of a property', function () {
      expect(new PropertyDecorator(args).toJSON()).to.have.keys(
        'isTitle',
        'isId',
        'position',
        'isSortable',
        'availableValues',
        'name',
        'label',
        'type',
        'reference',
        'components',
        'isDisabled',
        'subProperties',
        'isArray',
        'custom',
      )
    })
  })

  afterEach(function () {
    sinon.restore()
  })
})
