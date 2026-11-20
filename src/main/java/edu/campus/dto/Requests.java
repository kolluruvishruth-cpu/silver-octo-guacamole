package edu.campus.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
public class Requests {
 public record Registration(@NotBlank String name,@Email @NotBlank String email,@NotBlank String registration,@NotBlank String department,@NotBlank @Pattern(regexp="STUDENT|FACULTY") String role,@Size(min=10,max=100) String password,@NotBlank String confirmPassword){}
 public record BookingRequest(@NotNull Long resourceId,@NotNull LocalDateTime startTime,@NotNull LocalDateTime endTime,@NotBlank @Size(max=255) String purpose,@Min(1) Integer attendees,@Size(max=3000) String notes){}
 public record Profile(@NotBlank String name,@NotBlank String department,@NotBlank String registration){}
 public record Password(@NotBlank String currentPassword,@Size(min=10,max=100) String newPassword){}
 public record Decision(@NotBlank @Pattern(regexp="APPROVED|REJECTED|COMPLETED") String status,@Size(max=255) String reason){}
 public record ResourceInput(@NotBlank String name,@NotBlank @Pattern(regexp="Classroom|Seminar Hall|Laboratory|Conference Room|Sports Facility|Equipment|Other") String category,@NotBlank String building,@NotBlank String location,@Min(1) Integer capacity,@Size(max=3000) String description,String facilities,String imageUrl,boolean active){}
}
