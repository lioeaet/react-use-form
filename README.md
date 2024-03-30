useForm

виды валидации
1. Валидация поля становится доступной после одного из 3 экшнов: action.submit(), actions.validate(name), actions.blur(name).
2. По умолчанию валидация происходит на action change поля с доступной валидацией.
3. Функции валидации задаются при инициализации. Переустановка изначальных валидаторов происходит после выполнения reinitialize.
4. Если у инпута задано несколько видов валидаторов, каждый выполнится в своё время.
5. dependantFields при изменении основных инпутов валидируются в то время, как если бы экшны выполнялись на них самих.
6. Инпуты с типом валидации BLUR валидируются при выполнении actions.blur() и перед actions.submit().
7. Валидация связанных инпутов включеается отдельно от основного инпута.
8. В библиотеке есть зарезервированый ключ поля 'i'.
9. Инпуты внутри массивов должны сохранять порядок на время асинхронной валидации, либо валидироваться отдельно.


useSessionForm


({
  initValues: {} | [],
  validate: {
    field_1: func,
    field_2: array([]),
    password: advanced({
      CHANGE: validator,
      BLUR: validator,
      SUBMIT: validator,
    }),
    deep: {
      repeat: advanced({
        CHANGE: validator,
        BLUR: validator,
        SUBMIT: validator
        // dependantFields срабатывает:
        // при валидации поля password, если уже была запущена валидация на deep.repeat
        // deep.repeat так же валидируем на изменение deep
        // изменения предков изменяет потомков
        dependantFields: ['password']
      })
    }
  } | Promise | array([]),
  submit: func
}) => [Form, state, actions]

const VALIDATION_TYPES = {
  CHANGE: Symbol('CHANGE'),
  BLUR: Symbol('BLUR'),
  SUBMIT: Symbol('SUBMIT'),
}

const getInitState = initValues => ({
  values: initValues,
  submit: false,
  submitted: false,
  failed: false,
  canValidate: {},
  errors: {},
  loaders: {},
  initializing: false
})

// validators
type ExtendedValidator = {
  CHANGE?: Validator,
  BLUR?: Validator,
  SUBMIT?: Validator,
  dependantFields?: Entity(string, Validator)
}

type Validator = Validator[] |
  (value, ...dependantValues: any[]) => (Promise | ) |
  ExtendedValidator

<Form>
  <Input name='k' />
</Form>
