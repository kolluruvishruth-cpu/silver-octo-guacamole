package edu.campus.repository;
import edu.campus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserRepository extends JpaRepository<User,Long> {
java.util.Optional<User> findByEmail(String email);
 boolean existsByEmail(String email); boolean existsByRegistration(String registration);
}