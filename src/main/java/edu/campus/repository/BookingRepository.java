package edu.campus.repository;
import edu.campus.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
public interface BookingRepository extends JpaRepository<Booking,Long> {
java.util.List<Booking> findByUserIdOrderByStartTimeDesc(Long id);
 @org.springframework.data.jpa.repository.Query("select b from Booking b where b.resource.id=:resource and b.status in ('PENDING','APPROVED') and b.startTime<:end and b.endTime>:start")
 java.util.List<Booking> conflicts(@org.springframework.data.repository.query.Param("resource") Long resource,@org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start,@org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);
}