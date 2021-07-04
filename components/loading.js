import styles from '../styles/loading.module.css'

const Loading = ({ loading }) => {
  if (!loading) {
    return null
  }

  return <div className={styles.loading}><div className={styles['lds-dual-ring']}></div><div className={styles['loading-text']}>Loading...</div></div>
}

export default Loading