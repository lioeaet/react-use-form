# useForm

В библиотеке реализована абстракция валидации для форм на react, включая асинхронную валидацию.

## Использование

Хук `useForm({ initValues, validators, submit })` возвращает компонент Form c контекстом формы и объект `actions` с функциями для работы с ней.

```js
const FormApp = () => {
  const { Form, actions } = useForm({
    // 1. Передаём начальные значения в initValues
    initValues: {
      account: '',
      password: '',
      passwordRepeat: ''
    },
    // 2. Передаём функции валидации полей в validators
    validators: {
      account: (val) => !val && 'should not be empty',
      password: [
        (val) => !val && 'should not be empty',
        (val) => val.length < 5 && 'at least 5 symbols'
      ],
      passwordRepeat: advanced({
        PARENTS: ['password'],
        CHANGE: [
          (val) => !val && 'should not be empty',
          (val) => Promise.resolve(val.length < 5 && 'at least 5 symbols'),
          (val, password) => val !== password && 'should be equal with password'
        ]
      })
    },
    // 3. Передаём функцию для отправки в submit
    submit: values => console.log(values)
  })

  return (
    // 4. Ставим функцию из actions.submit как обработчик формы
    <Form onSubmit={actions.submit}>
      <Input name="account" />
      <Input name="password" />
      <Input name="passwordRepeat" />
    </Form>
  )
}

function Input({ name }) {
  // 5. Используем состояние и обработчики инпутов через useField по имени
  const { value, error, loading, onChange, onBlur } = useField(name)
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        {loading && 'loading...'}
      </div>
      <div>{error}</div>
    </div>
  )
}
```

В качестве валидатора можно передать функцию, массив функций или объекты, возвращаемые из функции `advanced` и `array`

Валидатор содержит функции, принимающие в аргумент значение поля и родительских полей. Она возвращает truly-значение при ошибке, либо falsy-значение при валидном значении.

## useField(name)

`useField` - хук, по имени поля возвращающий его текущие значения `value`, `error` и `loading`. Кроме того, он возвращает обработчики событий `onChange` и `onBlur` для целевого инпута.

## advanced(validatorObj)

`advanced`- функция, позволяющая установить для инпута тип валидации (`CHANGE`, `BLUR`, `SUBMIT`) и родительские поля (`PARENTS`): те поля, значения которых требуются для его валидации

Функции и массивы, переданные в объект `validators` для поля, аналогичны валидаторам `CHANGE` из `advanced`-валидатора
 
1. `CHANGE`-валидация срабатывает на `onChange(value)` инпута со включенной валидацией. Валидация включается после `onBlur()` целевого инпута, либо на выполнение `actions.submit(e)`. `onBlur()` целевого инпута и `actions.submit(e)` также вызывает `CHANGE`-валидацию.
2. `BLUR`-валидация срабатывает при выполнении `onBlur()` целевого инпута, либо на `actions.submit(e)`.
3. `SUBMIT`-валидация срабатывает при выполнении `actions.submit(e)`.

В библиотеке кешируется результат последней проведённой валидации. Валидация с предыдущими значениями инпутов отдаёт закешированный результат ошибки.

`PARENTS` - массив с именами полей, значения которых требуются для валидации целевого поля

```js
const FormApp = () => {
  const { Form, actions } = useForm({
    initValues: {
      password: '',
      passwordRepeat: ''
    },
    validators: {
      account: (val) => !val && 'should not be empty',
      password: (val) => !val && 'should not be empty',
      passwordRepeat: advanced({
        // 1. Передаём password в PARENTS advanced-валидатора
        PARENTS: ['password'],
        CHANGE: [
          (val) => !val && 'should not be empty',
          // 2. Используем значение связанного поля внутри функции валидации
          (val, password) => val !== password && 'should be equal with password'
        ]
      })
    },
    submit: values => console.log(values)
  })

  return (
    <Form onSubmit={actions.submit}>
      <Input name="password" />
      <Input name="passwordRepeat" />
    </Form>
  )
}
```

## Асинхронная валидация

Из функции валидации можно вернуть промис. Как и синхронные функции валидации, этот промис должен вернуть truly-значение при ошибке, либо falsy-значение при валидном значении.

На время выполнении промиса, в значение loading для связанного инпута устанавливается флаг true.

## actions

`actions` - это объект с функциями для работы с формой. Чаще всего Вам потребуется только 2 из них - submit и reset.

`submit(e)` - обёртка над переданной в конфиг функцией submit, используется для отправки формы на сервер

`reset(initValues)` - функция для реинициализации формы с переданными значениями

Остальные функции из `actions` принимают имя поля первым аргументом. Они работают с полями формы, обёртки над ними также доступны из `useField(name)` и `useSubformsArray(name)`.

## array

В библиотеке есть поддержка массивов из форм. Для изменения массивов поддерживается 3 экшна: `insert`, `remove` и `replace`.

## Другое

1. Функции валидации задаются при инициализации. Переустановка изначальных валидаторов происходит после выполнения reinitialize.
2. Асинхронные валидации производятся не дожидаясь завершения друг друга. В поле ошибки попадает первая ошибка, возвращённая из валидатора, выполненного ранее остальных.
3. dependantFields при изменении основных инпутов валидируются в то время, как если бы экшны выполнялись на них самих.
4. В библиотеке есть зарезервированый для массивов ключ поля 'i'.
5. Валидация связанных инпутов включеается отдельно от основного инпута.

