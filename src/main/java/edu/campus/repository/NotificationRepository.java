package edu.campus.repository;
import edu.campus.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
public interface NotificationRepository extends JpaRepository<Notification,Long> {
java.util.List<Notification> findByUserIdOrderByCreatedAtDesc(Long id);
}