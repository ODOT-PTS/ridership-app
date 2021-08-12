import styles from '../styles/loading.module.css'

const Loading = ({ loading }) => {
  if (!loading) {
    return null
  }

  return (
    <div className={styles.loading}>
      <div className={styles['loading-text']}>Loading Ridership...</div>
      <div className={styles.loader}>
        <div className={styles['sk-grid']}>
          <div className={styles['sk-grid-cube']}></div>
          <div className={styles['sk-grid-cube']}></div>
          <div className={styles['sk-grid-cube']}></div>
          <div className={styles['sk-grid-cube']}></div>
          <div className={styles['sk-grid-cube']}></div>
          <div className={styles['sk-grid-cube']}></div>
          <div className={styles['sk-grid-cube']}></div>
          <div className={styles['sk-grid-cube']}></div>
          <div className={styles['sk-grid-cube']}></div>
        </div>
      </div>
    </div>
  )
}

export default Loading