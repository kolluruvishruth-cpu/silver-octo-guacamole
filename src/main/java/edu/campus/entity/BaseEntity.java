package edu.campus.entity;
import jakarta.persistence.*;
import java.time.*;
@MappedSuperclass
public abstract class BaseEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 public LocalDateTime createdAt=LocalDateTime.now();
 public LocalDateTime updatedAt=LocalDateTime.now();
 @PreUpdate void touch(){updatedAt=LocalDateTime.now();}
 public abstract String label();
}
