import styles from '../styles/loading.module.css'

const Loading = ({ loading }) => {
  if (!loading) {
    return null
  }

  return (
    <div className={styles.loading}>
      <div className={styles['loading-text']}>Loading Ridership...</div>
      <div className={styles.loader}>
        <div className={styles.train}></div>
        <div className={styles.track}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}

export default Loading