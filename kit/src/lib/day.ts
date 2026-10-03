import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import locale from 'dayjs/plugin/updateLocale'
import relative from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(utc)
dayjs.extend(locale)
dayjs.extend(relative)
dayjs.extend(timezone)

export default dayjs
