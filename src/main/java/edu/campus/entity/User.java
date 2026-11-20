package edu.campus.entity;
import jakarta.persistence.*;
import java.time.*;
@Entity
@Table(name="campus_users",uniqueConstraints={@UniqueConstraint(columnNames="email"),@UniqueConstraint(columnNames="registration")})
public class User extends BaseEntity {
 public String name,email,registration,department,role;
 @com.fasterxml.jackson.annotation.JsonIgnore private String password;
 public boolean active=true;
 public String getPassword(){return password;}
 public void setPassword(String hash){password=hash;}
 @Override public String label(){return name;}
}